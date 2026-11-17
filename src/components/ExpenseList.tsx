"use client";
import { useState } from "react";
import { fmt } from "@/lib/format";
import { CATEGORIES } from "./ExpenseForm";
import { ExpenseActions } from "./ExpenseTools";
import { ShareBillModal } from "./ShareBillModal";
import { useState } from "react";
// ... (rest of imports)

export function ExpenseList({ groupId, expenses, members, me, isAdmin, personal }: { groupId: string; expenses: any[]; members: { user_id: string; name: string }[]; me: string; isAdmin: boolean; personal?: boolean }) {
  const [sharingId, setSharingId] = useState<string | null>(null);
  // ... rest of component logic

  return (<section className="space-y-2"><h2 className="h-card">Expenses <span className="font-normal text-muted">({list.length}{list.length !== expenses.length ? ` of ${expenses.length}` : ""})</span></h2>
    {/* ... filters ... */}
    {list.map((e) => { const mine = e.created_by === me || isAdmin; const files = (e.expense_attachments ?? []).length; return (
      <details key={e.id} className="rounded-2xl border border-border bg-card shadow-sm">
        <summary className="sum gap-3 px-3 py-2"><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{e.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1"><span className="chip">{shortDate(e.expense_date)}</span><span className="chip">{e.category}</span><span className="chip">{e.split_method}</span>{files > 0 && <span className="chip">📎 {files}</span>}</span></span>
          <span className="shrink-0 font-mono text-sm font-bold">{fmt(Number(e.amount_minor), e.currency)}</span></summary>
        <div className="space-y-2 border-t border-border px-3 pb-3 pt-2 text-sm">
          {e.notes && <p className="italic text-muted">{e.notes}</p>}
          {!personal && <div className="grid grid-cols-2 gap-3"><div><p className="h-sec mb-0.5">Paid</p>{rows(e.expense_payments, e.currency)}</div><div><p className="h-sec mb-0.5">Owes</p>{rows(e.expense_splits, e.currency)}</div></div>}
          <div className="flex gap-2">
            <Receipts groupId={groupId} expenseId={e.id} files={e.expense_attachments ?? []} canEdit={mine} />
            <button className="btn btn-sm btn-lime" onClick={() => setSharingId(e.id)}>Share Bill</button>
          </div>
          {mine && <ExpenseActions groupId={groupId} members={members} me={me} e={e} personal={personal} />}
          {sharingId === e.id && <ShareBillModal expense={e} groupName="SplitLoL Group" onClose={() => setSharingId(null)} />}
        </div></details>); })}</section>);
}
