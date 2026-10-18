// All money is integer minor units (paise/cents). No floats anywhere.
export const MINOR_DIGITS: Record<string, number> = { INR:2, USD:2, GBP:2, EUR:2, AED:2, CAD:2, AUD:2 };

export function toMinor(input: string, currency = "INR"): number {
  const d = MINOR_DIGITS[currency] ?? 2;
  const m = /^(\d+)(?:\.(\d+))?$/.exec(input.trim());
  if (!m) throw new Error("Invalid amount");
  const frac = m[2] ?? "";
  if (frac.length > d) throw new Error(`Max ${d} decimal places for ${currency}`);
  return Number(m[1]) * 10 ** d + Number(frac.padEnd(d, "0") || 0);
}

/** Largest-remainder allocation; ties broken by lowest index. Sum(out) === total. */
export function allocate(total: number, weights: number[]): number[] {
  if (!Number.isInteger(total) || total < 0) throw new Error("total must be a non-negative integer");
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) throw new Error("weights must be non-negative integers");
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) throw new Error("at least one positive weight required");
  const T = BigInt(total), S = BigInt(sum);
  const out = weights.map((w) => Number((T * BigInt(w)) / S));
  let rem = total - out.reduce((a, b) => a + b, 0);
  const order = weights
    .map((w, i) => ({ i, w, r: (T * BigInt(w)) % S }))
    .filter((x) => x.w > 0)
    .sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  for (let k = 0; rem > 0; k++, rem--) out[order[k % order.length].i]++;
  return out;
}

export type Method = "equal" | "shares" | "percent" | "exact";
export interface Participant { id: string; value?: number } // shares | basis points (1% = 100) | exact minor units

export function splitExpense(total: number, method: Method, ps: Participant[]): Record<string, number> {
  if (ps.length === 0) throw new Error("No participants");
  let amounts: number[];
  if (method === "equal") amounts = allocate(total, ps.map(() => 1));
  else if (method === "shares") amounts = allocate(total, ps.map((p) => p.value ?? 0));
  else if (method === "percent") {
    const bp = ps.map((p) => p.value ?? 0);
    if (bp.reduce((a, b) => a + b, 0) !== 10000) throw new Error("Percentages must total 100%");
    amounts = allocate(total, bp);
  } else {
    amounts = ps.map((p) => p.value ?? 0);
    if (amounts.some((a) => a < 0)) throw new Error("Negative allocation");
    if (amounts.reduce((a, b) => a + b, 0) !== total) throw new Error("Exact amounts must equal the total");
  }
  return Object.fromEntries(ps.map((p, i) => [p.id, amounts[i]]));
}

/** subtotal + tax + service + tip - discount. Adjustments are added ON TOP of the entered subtotal. */
export function totalWithAdjustments(subtotal: number, a: { tax?: number; service?: number; tip?: number; discount?: number }) {
  const t = subtotal + (a.tax ?? 0) + (a.service ?? 0) + (a.tip ?? 0) - (a.discount ?? 0);
  if (t <= 0) throw new Error("Total must be positive");
  return t;
}

export function validatePayments(total: number, payments: { userId: string; amount: number }[]) {
  if (payments.some((p) => p.amount < 0)) throw new Error("Negative payment");
  if (payments.reduce((a, p) => a + p.amount, 0) !== total) throw new Error("Payments must equal the total");
}
