"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AddExpense } from "./GroupClient";
export function ExpenseActions({ groupId, members, me, e, personal }: { groupId: string; members: { user_id: string; name: string }[]; me: string; e: any; personal?: boolean }) {
  const r = useRouter(); const [editing, setEditing] = useState(false); const [err, setErr] = useState(""); const sb = supabaseBrowser();
  const done = (error: { message: string } | null) => (error ? setErr(error.message) : r.refresh());
  const pay = e.expense_payments.map((p: any) => ({ user_id: p.user_id, amount: Number(p.amount_minor) }));
  const spl = e.expense_splits.map((p: any) => ({ user_id: p.user_id, amount: Number(p.amount_minor) }));
  async function del() {
    if (!confirm(`Delete "${e.title}"? Balances will be recalculated.`)) return;
    const { error } = await sb.rpc("delete_expense", { p_id: e.id }); if (error) return setErr(error.message);
    const paths = (e.expense_attachments ?? []).map((a: any) => a.path); if (paths.length) await sb.storage.from("receipts").remove(paths); // best effort
    r.refresh();
  }
  async function dup() {
    done((await sb.rpc("create_expense", { p_group: groupId, p_title: `${e.title} (copy)`, p_amount: Number(e.amount_minor), p_currency: e.currency,
      p_date: new Date().toISOString().slice(0, 10), p_category: e.category, p_method: e.split_method, p_notes: e.notes, p_payments: pay, p_splits: spl })).error);
  }
  if (editing) return <AddExpense personal={personal} groupId={groupId} currency={e.currency} members={members} me={me} onDone={() => setEditing(false)}
    edit={{ id: e.id, title: e.title, amountMinor: Number(e.amount_minor), date: e.expense_date, category: e.category, notes: e.notes ?? "", payments: pay, splits: Object.fromEntries(spl.map((s: any) => [s.user_id, s.amount])) }} />;
  return (<div className="mt-2 flex flex-wrap gap-2 font-sans">
    <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit</button>
    <button className="btn btn-sm" onClick={dup}>Duplicate</button>
    <button className="btn btn-coral btn-sm" onClick={del}>Delete</button>
    {err && <span role="alert" className="text-danger text-sm">{err}</span>}</div>);
}
