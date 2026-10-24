"use client";
import { useState } from "react";
import { fmt } from "@/lib/format";
import { CATEGORIES } from "./ExpenseForm";
import { ExpenseActions } from "./ExpenseTools";
import { Receipts } from "./Receipts";
const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
export function ExpenseList({ groupId, expenses, members, me, isAdmin, personal }: { groupId: string; expenses: any[]; members: { user_id: string; name: string }[]; me: string; isAdmin: boolean; personal?: boolean }) {
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [who, setWho] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const nm = (id: string) => members.find((m) => m.user_id === id)?.name ?? "Former member";
  const list = expenses.filter((e) => (!q || `${e.title} ${e.notes ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!cat || e.category === cat)
    && (!who || e.expense_payments.some((p: any) => p.user_id === who) || e.expense_splits.some((s: any) => s.user_id === who)) && (!from || e.expense_date >= from) && (!to || e.expense_date <= to));
  const clear = () => { setQ(""); setCat(""); setWho(""); setFrom(""); setTo(""); };
  const active = [cat, who, from, to].filter(Boolean).length;
  const rows = (l: any[], cur: string) => l.map((x: any) => <div key={x.user_id} className="flex justify-between gap-2"><span className="truncate">{nm(x.user_id)}</span><span className="font-mono">{fmt(Number(x.amount_minor), cur)}</span></div>);
  return (<section className="space-y-2"><h2 className="h-card">Expenses <span className="font-normal text-muted">({list.length}{list.length !== expenses.length ? ` of ${expenses.length}` : ""})</span></h2>
    {expenses.length > 0 && <div className="space-y-2"><input className="field" type="search" placeholder="Search title or notes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <details className="rounded-xl border border-border bg-card"><summary className="sum px-3 text-sm">Filters {active > 0 && <span className="chip">{active} on</span>}</summary>
        <div className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-4">
          <select className="field" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category filter"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="field" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Member filter"><option value="">All members</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select>
          <input className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" /><input className="field" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          <button type="button" className="col-span-2 min-h-[36px] text-left text-sm underline sm:col-span-4" onClick={clear}>Clear filters</button></div></details></div>}
    {!expenses.length && <p className="card text-sm">No expenses yet.</p>}{!!expenses.length && !list.length && <p className="card text-sm">No expenses match these filters.</p>}
    {list.map((e) => { const mine = e.created_by === me || isAdmin; const files = (e.expense_attachments ?? []).length; return (
      <details key={e.id} className="rounded-2xl border border-border bg-card shadow-sm">
        <summary className="sum gap-3 px-3 py-2"><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{e.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1"><span className="chip">{shortDate(e.expense_date)}</span><span className="chip">{e.category}</span><span className="chip">{e.split_method}</span>{files > 0 && <span className="chip">📎 {files}</span>}</span></span>
          <span className="shrink-0 font-mono text-sm font-bold">{fmt(Number(e.amount_minor), e.currency)}</span></summary>
        <div className="space-y-2 border-t border-border px-3 pb-3 pt-2 text-sm">
          {e.notes && <p className="italic text-muted">{e.notes}</p>}
          {!personal && <div className="grid grid-cols-2 gap-3"><div><p className="h-sec mb-0.5">Paid</p>{rows(e.expense_payments, e.currency)}</div><div><p className="h-sec mb-0.5">Owes</p>{rows(e.expense_splits, e.currency)}</div></div>}
          <Receipts groupId={groupId} expenseId={e.id} files={e.expense_attachments ?? []} canEdit={mine} />
          {mine && <ExpenseActions groupId={groupId} members={members} me={me} e={e} personal={personal} />}</div></details>); })}</section>);
}
