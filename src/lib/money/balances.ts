export interface LedgerExpense { payments: { userId: string; amount: number }[]; splits: { userId: string; amount: number }[] }
export interface Settlement { from: string; to: string; amount: number; status: "pending" | "confirmed" | "rejected" }
export type Net = Record<string, number>; // + = is owed, - = owes. One currency per call.

export function netPositions(expenses: LedgerExpense[], settlements: Settlement[] = []): Net {
  const net: Net = {};
  const add = (u: string, n: number) => (net[u] = (net[u] ?? 0) + n);
  for (const e of expenses) {
    e.payments.forEach((p) => add(p.userId, p.amount));
    e.splits.forEach((s) => add(s.userId, -s.amount));
  }
  for (const s of settlements) if (s.status === "confirmed") { add(s.from, s.amount); add(s.to, -s.amount); }
  return net;
}

/** Recommendation only; never modifies the ledger. */
export function simplify(net: Net): { from: string; to: string; amount: number }[] {
  const cr = Object.entries(net).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const db = Object.entries(net).filter(([, v]) => v < 0).map(([k, v]) => [k, -v] as [string, number]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < cr.length && j < db.length) {
    const amt = Math.min(cr[i][1], db[j][1]);
    out.push({ from: db[j][0], to: cr[i][0], amount: amt });
    cr[i][1] -= amt; db[j][1] -= amt;
    if (cr[i][1] === 0) i++;
    if (db[j][1] === 0) j++;
  }
  return out;
}
