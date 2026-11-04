import type { SupabaseClient } from "@supabase/supabase-js";
/** CONTRACT for Guest Mode: save local groups as JSON under this localStorage key. Adjust readLocalGroups() if your Guest Mode stores them differently. */
export const GUEST_STORAGE_KEY = "splitequal.guest.groups";
export interface LocalExpense { id?: string; title: string; amountMinor: number; date?: string; category?: string; notes?: string; method?: string; paidBy: { member: string; amount: number }[]; splits: { member: string; amount: number }[] }
export interface LocalGroup { id: string; name: string; type?: string; currency: string; me?: string; members: { id: string; name: string }[]; expenses?: LocalExpense[]; settlements?: { id: string; from: string; to: string; amountMinor: number; date?: string }[] }
export function toPayload(g: LocalGroup) {
  return { name: g.name, type: g.type ?? "Custom", currency: g.currency, me: g.me ?? null, members: g.members.map((m) => ({ id: m.id, name: m.name })),
    expenses: (g.expenses ?? []).map((e) => ({ title: e.title, amount_minor: e.amountMinor, date: e.date, category: e.category, notes: e.notes, method: e.method, paid_by: e.paidBy, splits: e.splits })),
    settlements: (g.settlements ?? []).map((s) => ({ from: s.from, to: s.to, amount_minor: s.amountMinor })) };
}
export function readLocalGroups(): LocalGroup[] { try { const v = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; } }
/** Pushes each local group to Supabase (local members become shadow members). The local group id is the idempotency key, so retries never duplicate. Imported groups are removed locally; failures are kept for retry. */
export async function migrateGuestGroups(sb: SupabaseClient): Promise<{ imported: number; failed: number }> {
  const groups = readLocalGroups(); if (!groups.length) return { imported: 0, failed: 0 };
  const keep: LocalGroup[] = []; let imported = 0;
  for (const g of groups) { const { error } = await sb.rpc("import_guest_group", { p_payload: toPayload(g), p_key: `guest:${g.id}` }); if (error) keep.push(g); else imported++; }
  if (keep.length) localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(keep)); else localStorage.removeItem(GUEST_STORAGE_KEY);
  return { imported, failed: keep.length };
}
