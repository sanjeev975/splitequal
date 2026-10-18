"use client";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { newId, useGuestGroups } from "@/lib/guest/store";
import { AddExpense, type GuestSave } from "@/components/ExpenseForm";
import { netPositions, simplify } from "@/lib/money/balances";
import { fmt } from "@/lib/format";
import type { LocalExpense, LocalGroup } from "@/lib/guestMigration";
export default function GuestGroupPage() {
  const { id } = useParams<{ id: string }>(); const r = useRouter(); const { groups, update } = useGuestGroups(); const [editing, setEditing] = useState<string | null>(null); const [newName, setNewName] = useState(""); const [err, setErr] = useState("");
  if (groups === null) return <p className="card">Loading…</p>;
  const g = groups.find((x) => x.id === id);
  if (!g) return <div className="card space-y-2"><p>This group isn't on this device.</p><Link className="underline" href="/guest">Back to guest groups</Link></div>;
  const patchG = (fn: (g: LocalGroup) => LocalGroup) => update((gs) => gs.map((x) => (x.id === id ? fn(x) : x)));
  const expenses = g.expenses ?? []; const settlements = g.settlements ?? []; const cur = g.currency; const today = new Date().toISOString().slice(0, 10);
  const members = g.members.map((m) => ({ user_id: m.id, name: m.name })); const name = (m: string) => g.members.find((x) => x.id === m)?.name ?? "Removed";
  const net = netPositions(expenses.map((e) => ({ payments: e.paidBy.map((p) => ({ userId: p.member, amount: p.amount })), splits: e.splits.map((s) => ({ userId: s.member, amount: s.amount })) })),
    settlements.map((s) => ({ from: s.from, to: s.to, amount: s.amountMinor, status: "confirmed" as const })));
  const transfers = simplify(net); const used = new Set([...expenses.flatMap((e) => [...e.paidBy, ...e.splits].map((x) => x.member)), ...settlements.flatMap((s) => [s.from, s.to])]);
  const save = (x: GuestSave, existing?: string) => { const le: LocalExpense = { id: existing ?? newId(), title: x.title, amountMinor: x.amountMinor, date: x.date, category: x.category, notes: x.notes ?? undefined, method: x.method, paidBy: x.payments, splits: x.splits };
    patchG((gr) => ({ ...gr, expenses: existing ? (gr.expenses ?? []).map((e) => (e.id === existing ? le : e)) : [le, ...(gr.expenses ?? [])] })); };
  function addMember(e: React.FormEvent) { e.preventDefault(); const n = newName.trim().slice(0, 40); setErr("");
    if (g!.members.some((m) => m.name.toLowerCase() === n.toLowerCase())) return setErr("Someone in this group already has that name."); patchG((gr) => ({ ...gr, members: [...gr.members, { id: newId(), name: n }] })); setNewName(""); }
  return (<div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><Link href="/guest" className="text-sm underline">← All groups</Link><h1 className="font-display text-3xl font-bold">{g.name}</h1><p className="opacity-70">{g.type} · {cur}</p></div>
    <button className="underline text-danger text-sm" onClick={() => { if (confirm(`Delete "${g.name}" from this device? This can't be undone.`)) { update((gs) => gs.filter((x) => x.id !== id)); r.push("/guest"); } }}>Delete group</button></div>
    <section className="card space-y-2"><h2 className="font-display text-xl font-bold">People</h2><ul className="flex flex-wrap gap-2">{g.members.map((m) => <li key={m.id} className="inset !py-1 text-sm">{m.name}{m.id === g.me && " (you)"}
      {m.id !== g.me && !used.has(m.id) && <button className="ml-2 text-danger" aria-label={`Remove ${m.name}`} onClick={() => patchG((gr) => ({ ...gr, members: gr.members.filter((x) => x.id !== m.id) }))}>×</button>}</li>)}</ul>
      <form onSubmit={addMember} className="flex gap-2"><input className="field" required maxLength={40} placeholder="Add a person" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New person's name" /><button className="btn">Add</button></form>{err && <p role="alert" className="text-danger text-sm">{err}</p>}</section>
    {g.members.length > 1 ? <AddExpense key={`new-${expenses.length}`} groupId={g.id} currency={cur} members={members} me={g.me ?? members[0].user_id} onSave={(x) => save(x)} /> : <p className="card">Add at least one more person to start splitting expenses.</p>}
    <section className="card space-y-2"><h2 className="font-display text-xl font-bold">Balances</h2>
      {!Object.keys(net).length ? <p>All settled — no expenses yet.</p> : <div className="inset space-y-1">{g.members.filter((m) => net[m.id] !== undefined).map((m) => { const v = net[m.id]; return <p key={m.id} className={v === 0 ? "" : v > 0 ? "text-emerald" : "text-coral"}>{m.name}: {v === 0 ? "settled" : `${v > 0 ? "is owed" : "owes"} ${fmt(Math.abs(v), cur)}`}</p>; })}</div>}
      {transfers.length > 0 && <div className="inset space-y-1"><p className="text-xs opacity-70">Suggested repayments (recommendation only):</p>{transfers.map((t, i) => <div key={i} className="flex flex-wrap items-center gap-2 text-sm"><span>{name(t.from)} → {name(t.to)}: <b>{fmt(t.amount, cur)}</b></span>
        <button className="btn btn-coral !py-1" onClick={() => patchG((gr) => ({ ...gr, settlements: [...(gr.settlements ?? []), { id: newId(), from: t.from, to: t.to, amountMinor: t.amount, date: today }] }))}>Mark as paid</button></div>)}</div>}
      {settlements.length > 0 && <details className="text-sm"><summary className="cursor-pointer">Payments marked as paid ({settlements.length})</summary>{settlements.map((s) => <p key={s.id}>{s.date} · {name(s.from)} → {name(s.to)} {fmt(s.amountMinor, cur)} <button className="underline text-danger" onClick={() => patchG((gr) => ({ ...gr, settlements: (gr.settlements ?? []).filter((x) => x.id !== s.id) }))}>Undo</button></p>)}</details>}</section>
    <section className="space-y-3"><h2 className="font-display text-xl font-bold">Expenses</h2>{!expenses.length && <p className="card">No expenses yet.</p>}
      {expenses.map((e) => editing === e.id ? <AddExpense key={e.id} groupId={g.id} currency={cur} members={members} me={g.me ?? members[0].user_id} onDone={() => setEditing(null)} onSave={(x) => save(x, e.id)}
        edit={{ id: e.id!, title: e.title, amountMinor: e.amountMinor, date: e.date ?? today, category: e.category ?? "Other", notes: e.notes ?? "", payments: e.paidBy.map((p) => ({ user_id: p.member, amount: p.amount })), splits: Object.fromEntries(e.splits.map((s) => [s.member, s.amount])) }} />
        : <article key={e.id ?? e.title} className="receipt"><div className="flex justify-between font-bold"><span>{e.title}</span><span>{fmt(e.amountMinor, cur)}</span></div><p className="text-sm">{e.date} · {e.category ?? "Other"} · {e.method ?? "exact"}</p>{e.notes && <p className="text-sm italic">{e.notes}</p>}
          <p className="text-sm">Paid: {e.paidBy.map((p) => `${name(p.member)} ${fmt(p.amount, cur)}`).join(" · ")}</p><p className="text-sm">Owes: {e.splits.map((s) => `${name(s.member)} ${fmt(s.amount, cur)}`).join(" · ")}</p>
          <div className="mt-2 flex gap-2 font-sans"><button className="btn !py-1 !px-3 text-sm" onClick={() => setEditing(e.id ?? null)}>Edit</button>
            <button className="btn btn-coral !py-1 !px-3 text-sm" onClick={() => confirm(`Delete "${e.title}"? Balances will be recalculated.`) && patchG((gr) => ({ ...gr, expenses: (gr.expenses ?? []).filter((x) => x.id !== e.id) }))}>Delete</button></div></article>)}</section></div>);
}
