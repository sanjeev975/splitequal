import { useCallback, useEffect, useState } from "react";
import { GUEST_STORAGE_KEY, readLocalGroups, type LocalGroup } from "@/lib/guestMigration";
export const newId = () => crypto.randomUUID();
/** Guest data lives ONLY in this browser (localStorage, same key the sign-up migration reads). Nothing is sent to a server. */
export function useGuestGroups() {
  const [groups, setGroups] = useState<LocalGroup[] | null>(null);
  useEffect(() => { const load = () => setGroups(readLocalGroups()); load(); window.addEventListener("storage", load); return () => window.removeEventListener("storage", load); }, []);
  const update = useCallback((fn: (g: LocalGroup[]) => LocalGroup[]) => {
    const next = fn(readLocalGroups());
    try { localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(next)); } catch { alert("Couldn't save: browser storage is full or blocked (private mode?)."); return; }
    setGroups(next);
  }, []);
  return { groups, update };
}
const CUR = ["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"];
const isAmt = (v: any) => Number.isInteger(v) && v >= 0;
const okLines = (l: any) => Array.isArray(l) && l.every((x) => x && typeof x.member === "string" && isAmt(x.amount));
/** Validates + normalizes an imported backup so a bad file can't break the app. Returns null if unusable. */
export function cleanGroup(g: any): LocalGroup | null {
  if (!g || typeof g.id !== "string" || typeof g.name !== "string" || !CUR.includes(g.currency) || !Array.isArray(g.members) || !g.members.length || g.members.length > 50) return null;
  if (!g.members.every((m: any) => m && typeof m.id === "string" && typeof m.name === "string" && m.name.trim())) return null;
  const ex = Array.isArray(g.expenses) ? g.expenses : []; if (ex.length > 500 || !ex.every((e: any) => e && typeof e.title === "string" && isAmt(e.amountMinor) && okLines(e.paidBy) && okLines(e.splits))) return null;
  const st = Array.isArray(g.settlements) ? g.settlements : []; if (!st.every((s: any) => s && typeof s.from === "string" && typeof s.to === "string" && isAmt(s.amountMinor))) return null;
  return { ...g, expenses: ex, settlements: st };
}
