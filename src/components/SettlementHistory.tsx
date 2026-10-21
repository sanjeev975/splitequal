"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fmt } from "@/lib/format";
const BADGE: Record<string, string> = { pending: "bg-soft text-soft-fg", confirmed: "bg-good text-on", rejected: "bg-danger text-on", cancelled: "bg-inset text-muted", reversed: "bg-accent text-on" };
export function SettlementHistory({ settlements, members, me, isAdmin }: { settlements: any[]; members: { user_id: string; name: string }[]; me: string; isAdmin: boolean }) {
  const r = useRouter(); const sb = supabaseBrowser(); const [err, setErr] = useState("");
  const nm = (id: string) => members.find((m) => m.user_id === id)?.name ?? "Former member";
  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => { setErr(""); const { error } = await p; if (error) setErr(error.message); else r.refresh(); };
  return (<section className="card space-y-2"><h2 className="font-display text-xl font-bold">Settlement history</h2>
    {!settlements.length && <p>No settlements yet.</p>}
    {settlements.map((s) => (<div key={s.id} className="inset text-sm space-y-1"><div className="flex flex-wrap items-center gap-2">
      <span className="flex-1">{nm(s.from_user)} → {nm(s.to_user)} <b>{fmt(Number(s.amount_minor), s.currency)}</b> · {new Date(s.created_at).toLocaleDateString()}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE[s.status]}`}>{s.status}</span></div>
      {s.note && <p>Note: {s.note}</p>}{s.resolution_note && <p>Reason: {s.resolution_note}</p>}
      <div className="flex gap-3">
        {s.status === "pending" && s.to_user === me && <><button className="underline" onClick={() => run(sb.rpc("confirm_settlement", { p_id: s.id }))}>Confirm received</button>
          <button className="underline text-danger" onClick={() => { const n = window.prompt("Reason for rejecting (optional)"); if (n !== null) run(sb.rpc("reject_settlement", { p_id: s.id, p_note: n })); }}>Reject</button></>}
        {s.status === "pending" && s.from_user === me && <button className="underline text-danger" onClick={() => confirm("Cancel this payment record?") && run(sb.rpc("cancel_settlement", { p_id: s.id }))}>Cancel</button>}
        {s.status === "confirmed" && (s.to_user === me || isAdmin) && <button className="underline text-danger" onClick={() => { const gone = [s.from_user, s.to_user].filter((u: string) => !members.some((m) => m.user_id === u)); if (gone.length && !confirm("One person in this payment is no longer in this group. They will get a notification, but they can no longer open the group, and the amount will show as owed by them again. Continue?")) return; const n = window.prompt("Reason for reversing this confirmed payment (required)"); if (n?.trim()) run(sb.rpc("reverse_settlement", { p_id: s.id, p_note: n })); }}>Reverse (correction)</button>}</div></div>))}
    {err && <p role="alert" className="text-danger text-sm">{err}</p>}</section>);
}
