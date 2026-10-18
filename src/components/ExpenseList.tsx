"use client";
import { useState } from "react";
import { fmt } from "@/lib/format";
import { CATEGORIES } from "./ExpenseForm";
import { ExpenseActions } from "./ExpenseTools";
import { Receipts } from "./Receipts";
export function ExpenseList({ groupId, expenses, members, me, isAdmin }: { groupId: string; expenses: any[]; members: { user_id: string; name: string }[]; me: string; isAdmin: boolean }) {
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [who, setWho] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const nm = (id: string) => members.find((m) => m.user_id === id)?.name ?? "Former member";
  const list = expenses.filter((e) => (!q || `${e.title} ${e.notes ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!cat || e.category === cat)
    && (!who || e.expense_payments.some((p: any) => p.user_id === who) || e.expense_splits.some((s: any) => s.user_id === who)) && (!from || e.expense_date >= from) && (!to || e.expense_date <= to));
  const clear = () => { setQ(""); setCat(""); setWho(""); setFrom(""); setTo(""); };
  return (<section className="space-y-3"><h2 className="font-display text-xl font-bold">Expenses</h2>
    {expenses.length > 0 && <div className="card grid gap-2 sm:grid-cols-5"><input className="field sm:col-span-2" placeholder="Search title or notes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <select className="field" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category filter"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      <select className="field" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Member filter"><option value="">All members</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select>
      <button className="underline text-sm" onClick={clear}>Clear filters</button>
      <input className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" /><input className="field" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      <p className="text-sm sm:col-span-3 self-center">Showing {list.length} of {expenses.length}</p></div>}
    {!expenses.length && <p className="card">No expenses yet.</p>}{!!expenses.length && !list.length && <p className="card">No expenses match these filters.</p>}
    {list.map((e) => (<article key={e.id} className="receipt"><div className="flex justify-between font-bold"><span>{e.title}</span><span>{fmt(Number(e.amount_minor), e.currency)}</span></div>
      <p className="text-sm">{e.expense_date} · {e.category} · {e.split_method}</p>{e.notes && <p className="text-sm italic">{e.notes}</p>}
      <details className="text-sm"><summary className="cursor-pointer">Who paid / who owes</summary>
        <p>Paid: {e.expense_payments.map((p: any) => `${nm(p.user_id)} ${fmt(Number(p.amount_minor), e.currency)}`).join(" · ")}</p>
        <p>Owes: {e.expense_splits.map((s: any) => `${nm(s.user_id)} ${fmt(Number(s.amount_minor), e.currency)}`).join(" · ")}</p></details>
      <Receipts groupId={groupId} expenseId={e.id} files={e.expense_attachments ?? []} canEdit={e.created_by === me || isAdmin} />
      {(e.created_by === me || isAdmin) && <ExpenseActions groupId={groupId} members={members} me={me} e={e} />}</article>))}</section>);
}
