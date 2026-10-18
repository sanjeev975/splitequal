"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { splitExpense, toMinor, type Method } from "@/lib/money/split";
import { fmt } from "@/lib/format";
import { PayDialog } from "./PayDialog";
type M = { user_id: string; name: string };

export { AddExpense } from "./ExpenseForm";

export function SettleRow({ groupId, cur, t, me, fromName, toName, nonce, pendingId }: { groupId: string; cur: string; t: { from: string; to: string; amount: number }; me: string; fromName: string; toName: string; nonce: number; pendingId?: string }) {
  const r = useRouter(); const [err, setErr] = useState(""); const [open, setOpen] = useState(false); const sb = supabaseBrowser();
  async function record() {
    const note = window.prompt("Add a note for this payment (optional)", ""); if (note === null) return;
    const { error } = await sb.rpc("record_settlement", { p_group: groupId, p_to: t.to, p_amount: t.amount, p_currency: cur, p_note: note.trim() || null, p_key: `${t.from}:${t.to}:${t.amount}:${nonce}` });
    if (error) setErr(error.message); else r.refresh();
  }
  async function confirm() { const { error } = await sb.rpc("confirm_settlement", { p_id: pendingId }); if (error) setErr(error.message); else r.refresh(); }
  return (<div className="flex flex-wrap items-center gap-2 text-sm">
    <span>{pendingId ? "Pending: " : ""}{fromName} → {toName}: <b>{fmt(t.amount, cur)}</b></span>
    {!pendingId && t.from === me && <button className="btn btn-coral !py-1" onClick={() => setOpen(true)}>Settle up</button>}{open && <PayDialog groupId={groupId} cur={cur} to={t.to} toName={toName} amount={t.amount} me={me} nonce={nonce} onClose={() => setOpen(false)} />}
    {pendingId && t.to === me && <button className="btn !py-1" onClick={confirm}>Confirm received</button>}
    {err && <span role="alert" className="text-danger">{err}</span>}</div>);
}
