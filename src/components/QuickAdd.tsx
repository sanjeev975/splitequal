"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AddExpense } from "./ExpenseForm";
type G = { id: string; name: string; base_currency: string }; type M = { user_id: string; name: string };
const KEY = "splitequal.quickadd.group";
/** The "Add" tab: the expense form itself, with a small group picker on top. Remembers the group you used last. */
export function QuickAdd({ groups, membersByGroup, me, initial }: { groups: G[]; membersByGroup: Record<string, M[]>; me: string; initial: string }) {
  const [gid, setGid] = useState(initial); const [saved, setSaved] = useState(""); const [n, setN] = useState(0);
  useEffect(() => { if (initial !== groups[0].id) return; try { const last = localStorage.getItem(KEY); if (last && groups.some((g) => g.id === last)) setGid(last); } catch { /* storage blocked: keep default */ } }, [initial, groups]);
  const g = groups.find((x) => x.id === gid) ?? groups[0]; const members = membersByGroup[g.id] ?? [];
  const pick = (id: string) => { setGid(id); setSaved(""); try { localStorage.setItem(KEY, id); } catch { /* ignore */ } };
  return (<div className="space-y-3">
    {groups.length > 1 ? <label className="block"><span className="h-sec">Add to group</span><select className="field mt-1" value={g.id} onChange={(e) => pick(e.target.value)}>{groups.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.base_currency}</option>)}</select></label>
      : <p className="text-sm text-muted">Adding to <span className="chip">{g.name}</span></p>}
    {saved && <p role="status" className="inset flex items-center justify-between gap-2 text-sm"><span>✓ Saved to {saved}</span><Link className="underline" href={`/groups/${g.id}`}>View group</Link></p>}
    {members.length < 2 ? <div className="card space-y-2 text-sm"><p>“{g.name}” only has you in it. Add a person (or a guest) first, then you can split expenses.</p><Link className="btn" href={`/groups/${g.id}`}>Open group</Link></div>
      : <AddExpense key={`${g.id}-${n}`} groupId={g.id} currency={g.base_currency} members={members} me={me} onDone={() => { setSaved(g.name); setN((x) => x + 1); try { localStorage.setItem(KEY, g.id); } catch { /* ignore */ } }} />}
  </div>);
}
