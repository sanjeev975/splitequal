"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fmt } from "@/lib/format";
import { upiLink, venmoLink } from "@/lib/payments";
type H = { upi_id: string | null; venmo_handle: string | null };
export function PayDialog({ groupId, cur, to, toName, amount, me, nonce, onClose }: { groupId: string; cur: string; to: string; toName: string; amount: number; me: string; nonce: number; onClose: () => void }) {
  const r = useRouter(); const sb = supabaseBrowser();
  const [h, setH] = useState<H | null | undefined>(undefined); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [opened, setOpened] = useState(false); const [copied, setCopied] = useState(false);
  useEffect(() => { sb.from("payment_handles").select("upi_id,venmo_handle").eq("user_id", to).maybeSingle().then(({ data }) => setH(data)); }, [sb, to]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const memo = "Splitequal settle-up";
  const upi = cur === "INR" && h?.upi_id ? upiLink({ vpa: h.upi_id, name: toName, amountMinor: amount, note: memo }) : null;
  const venmo = cur === "USD" && h?.venmo_handle ? venmoLink({ handle: h.venmo_handle, amountMinor: amount, note: memo }) : null;
  const desktop = typeof navigator !== "undefined" && !/android|iphone|ipad|ipod/i.test(navigator.userAgent);
  async function record() {
    setBusy(true); setErr("");
    const { error } = await sb.rpc("record_settlement", { p_group: groupId, p_to: to, p_amount: amount, p_currency: cur, p_note: note.trim() || null, p_key: `${me}:${to}:${amount}:${nonce}` });
    setBusy(false); if (error) return setErr(error.message); onClose(); r.refresh();
  }
  return (<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={`Settle up with ${toName}`} className="card w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
      <h2 className="font-display text-2xl font-bold">Pay {toName} {fmt(amount, cur)}</h2>
      <div className="inset space-y-2"><p className="font-semibold">Step 1 — Pay</p>
        {h === undefined && <p>Loading payment options…</p>}
        {upi && <button className="btn w-full" onClick={() => { setOpened(true); window.location.href = upi; }}>Pay with UPI app</button>}
        {upi && desktop && <p className="text-xs">UPI links open on phones. On a computer, copy the UPI ID and pay from your phone.</p>}
        {upi && <button className="underline text-sm" onClick={() => navigator.clipboard.writeText(h!.upi_id!).then(() => setCopied(true))}>{copied ? "Copied ✓" : `Copy UPI ID (${h!.upi_id})`}</button>}
        {venmo && <a className="btn w-full block text-center" href={venmo} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)}>Pay with Venmo</a>}
        {h !== undefined && !upi && !venmo && <p className="text-sm">{cur === "INR" || cur === "USD" ? `${toName} hasn't added a ${cur === "INR" ? "UPI ID" : "Venmo username"} yet. ` : `Quick-pay links are available for INR (UPI) and USD (Venmo). `}You can still pay another way (cash, bank transfer) and record it below.</p>}</div>
      <div className="inset space-y-2"><p className="font-semibold">Step 2 — Tell {toName} you've paid</p>
        <input className="field" maxLength={200} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
        <button className="btn btn-coral w-full" onClick={record} disabled={busy}>{busy ? "Recording…" : opened ? "I've paid — record it" : "I paid another way — record it"}</button>
        <p className="text-xs">Splitequal doesn't process or verify payments. This records that you say you paid; {toName} confirms receipt before balances change.</p></div>
      {err && <p role="alert" className="text-danger text-sm">{err}</p>}
      <button className="underline text-sm" onClick={onClose}>Close</button></div></div>);
}
