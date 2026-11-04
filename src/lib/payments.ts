// Deep-link builders. Amounts are integer minor units (no floats). Handles are re-validated before they are placed in a URL.
export const isValidUpi = (v: string) => /^[a-zA-Z0-9._-]{2,100}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(v);
export const isValidVenmo = (v: string) => /^[A-Za-z0-9_-]{5,30}$/.test(v);
export const fmtDecimal = (minor: number) => `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
/** UPI: upi://pay?pa=<VPA>&pn=<name>&am=<amount>&cu=INR&tn=<note> (NPCI linking spec). INR only. */
export function upiLink(o: { vpa: string; name: string; amountMinor: number; note: string }) {
  if (!isValidUpi(o.vpa)) throw new Error("Invalid UPI ID");
  const e = (s: string) => encodeURIComponent(s);
  return `upi://pay?pa=${e(o.vpa).replace(/%40/g, "@")}&pn=${e(o.name.slice(0, 40))}&am=${fmtDecimal(o.amountMinor)}&cu=INR&tn=${e(o.note.slice(0, 50))}`;
}
/** Venmo payment link per https://venmo.com/paymentlinks (opens the app on mobile, venmo.com on desktop). USD only. */
export function venmoLink(o: { handle: string; amountMinor: number; note: string }) {
  if (!isValidVenmo(o.handle)) throw new Error("Invalid Venmo username");
  return `https://venmo.com/${o.handle}?txn=pay&amount=${fmtDecimal(o.amountMinor)}&note=${encodeURIComponent(o.note).replace(/%20/g, "+")}`;
}
/** Cleans what a user typed/pasted into a raw UPI ID. Accepts a pasted full upi://pay?pa=... link too, extracting only the VPA. */
export function normalizeUpi(input: string): string {
  let v = input.trim();
  if (/^upi:\/\//i.test(v)) { try { v = new URL(v).searchParams.get("pa") ?? v; } catch { /* leave as typed; validation will reject it */ } }
  return v.replace(/\s+/g, "").toLowerCase(); // VPAs are case-insensitive; store lowercase
}
