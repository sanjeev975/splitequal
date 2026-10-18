// Pure aggregation (integer minor units, one currency at a time). "Total" = full expense amounts; "mine" = the user's own share. Settlements are NOT expenses and are excluded.
export interface Ex { group_id: string; currency: string; expense_date: string; category: string; amount_minor: number | string;
  expense_payments: { user_id: string; amount_minor: number | string }[]; expense_splits: { user_id: string; amount_minor: number | string }[] }
const n = (v: number | string) => Number(v);
const mine = (e: Ex, me: string) => e.expense_splits.filter((s) => s.user_id === me).reduce((a, s) => a + n(s.amount_minor), 0);
export function byCategory(ex: Ex[], mode: "total" | "mine", me: string) {
  const m: Record<string, number> = {};
  for (const e of ex) { const v = mode === "total" ? n(e.amount_minor) : mine(e, me); if (v > 0) m[e.category] = (m[e.category] ?? 0) + v; }
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
export function topN(items: { name: string; value: number }[], k = 7) {
  if (items.length <= k) return items; const rest = items.slice(k).reduce((a, i) => a + i.value, 0);
  return [...items.slice(0, k), { name: "Other categories", value: rest }];
}
export function byMember(ex: Ex[]) {
  const m: Record<string, { paid: number; owed: number }> = {}; const g = (u: string) => (m[u] ??= { paid: 0, owed: 0 });
  for (const e of ex) { e.expense_payments.forEach((p) => (g(p.user_id).paid += n(p.amount_minor))); e.expense_splits.forEach((s) => (g(s.user_id).owed += n(s.amount_minor))); }
  return m;
}
export function byMonth(ex: Ex[], me: string) {
  const m: Record<string, { total: number; mine: number }> = {};
  for (const e of ex) { const k = e.expense_date.slice(0, 7); const r = (m[k] ??= { total: 0, mine: 0 }); r.total += n(e.amount_minor); r.mine += mine(e, me); }
  return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0])).map(([month, v]) => ({ month, ...v }));
}
export const totals = (ex: Ex[], me: string) => ({
  spent: ex.reduce((a, e) => a + n(e.amount_minor), 0), share: ex.reduce((a, e) => a + mine(e, me), 0),
  paid: ex.reduce((a, e) => a + e.expense_payments.filter((p) => p.user_id === me).reduce((x, p) => x + n(p.amount_minor), 0), 0), count: ex.length });
