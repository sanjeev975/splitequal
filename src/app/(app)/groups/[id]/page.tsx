import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { netPositions, simplify } from "@/lib/money/balances";
import { fmt } from "@/lib/format";
import { AddExpense, SettleRow } from "@/components/GroupClient";
import { GroupAdmin } from "@/components/GroupAdmin";
import { SettlementHistory } from "@/components/SettlementHistory";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseActions } from "@/components/ExpenseTools";
import { LiveRefresh } from "@/components/LiveRefresh";
export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound(); // not even a valid id
  const sb = await supabaseServer();
  const [{ data: { user } }, { data: g, error: gErr }, { data: mem }, { data: ex }, { data: st }, { data: act }, { data: inv }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("groups").select("*").eq("id", id).maybeSingle(),
    sb.from("group_members").select("user_id,role,profiles(display_name,username,avatar_path,is_shadow)").eq("group_id", id),
    sb.from("expenses").select("*,expense_payments(*),expense_splits(*),expense_attachments(*)").eq("group_id", id).order("expense_date", { ascending: false }).order("created_at", { ascending: false }),
    sb.from("settlements").select("*").eq("group_id", id).order("created_at", { ascending: false }),
    sb.from("activity_logs").select("*").eq("group_id", id).order("created_at", { ascending: false }).limit(10),
    sb.from("group_invitations").select("id,expires_at,use_count").eq("group_id", id).is("revoked_at", null).gt("expires_at", new Date().toISOString()),
  ]);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/groups/${id}`)}`);
  if (gErr) throw new Error("Couldn't load this group"); // a real failure shows "try again", not a misleading "not found"
  if (!g) notFound(); // no access (left / removed / deleted): friendly page in groups/[id]/not-found.tsx
  // Legacy duplicates (same display name in one group) are shown with @username so people can tell them apart.
  const raw = (mem ?? []).map((m: any) => ({ user_id: m.user_id as string, dn: (m.profiles?.display_name as string) || "Member", un: (m.profiles?.username as string) || "" }));
  const members = raw.map((m) => ({ user_id: m.user_id, name: raw.some((o) => o.user_id !== m.user_id && o.dn.trim().toLowerCase() === m.dn.trim().toLowerCase()) ? `${m.dn} (@${m.un})` : m.dn }));
  const name = (u: string) => members.find((m) => m.user_id === u)?.name ?? "Former member";
  const isAdmin = (mem ?? []).some((m: any) => m.user_id === user.id && m.role !== "member");
  const isOwner = (mem ?? []).some((m: any) => m.user_id === user.id && m.role === "owner");
  const roster = (mem ?? []).map((m: any) => ({ user_id: m.user_id as string, name: (m.profiles?.display_name as string) || "Member", username: (m.profiles?.username as string) || "", avatar: (m.profiles?.avatar_path as string) || null, shadow: !!m.profiles?.is_shadow, role: m.role as string }));
  const curs = [...new Set([g.base_currency, ...(ex ?? []).map((e: any) => e.currency)])];
  const panels = curs.map((cur) => {
    const net = netPositions((ex ?? []).filter((e: any) => e.currency === cur).map((e: any) => ({
      payments: e.expense_payments.map((p: any) => ({ userId: p.user_id, amount: Number(p.amount_minor) })),
      splits: e.expense_splits.map((p: any) => ({ userId: p.user_id, amount: Number(p.amount_minor) })) })),
      (st ?? []).filter((s: any) => s.currency === cur).map((s: any) => ({ from: s.from_user, to: s.to_user, amount: Number(s.amount_minor), status: s.status })));
    return { cur, net, transfers: simplify(net) };
  });
  const pending = (st ?? []).filter((s: any) => s.status === "pending");
  return (<div className="space-y-4"><LiveRefresh groupId={id} />
    <header className="flex flex-wrap items-center gap-x-2 gap-y-1"><h1 className="mr-1 font-display text-2xl font-bold">{g.name}</h1><span className="chip">{g.type}</span><span className="chip">{g.base_currency}</span><span className="chip">{members.length} people</span>{g.archived_at && <span className="chip">Archived</span>}</header>
    <section className="card space-y-2"><h2 className="h-card">Balances</h2>
      {panels.map((p) => (<div key={p.cur} className="inset space-y-1"><p className="chip">{p.cur}</p>
        {Object.entries(p.net).filter(([, v]) => v !== 0).map(([u, v]) => <div key={u} className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate">{name(u)}</span><span className="shrink-0"><span className="mr-2 text-xs text-muted">{v >= 0 ? "is owed" : "owes"}</span><span className={`font-mono font-semibold ${v >= 0 ? "text-good" : "text-accent"}`}>{fmt(Math.abs(v), p.cur)}</span></span></div>)}
        {p.transfers.length > 0 && <p className="pt-1 text-xs text-muted">Suggested repayments (recommendation only)</p>}
        {p.transfers.map((t, i) => <SettleRow key={i} groupId={id} cur={p.cur} t={t} me={user.id} fromName={name(t.from)} toName={name(t.to)} nonce={(st ?? []).length} />)}
        {Object.values(p.net).every((v) => v === 0) && <p className="text-sm text-muted">All settled.</p>}</div>))}
          </section>
    <div id="add-expense" className="scroll-mt-20"><AddExpense groupId={id} currency={g.base_currency} members={members} me={user.id} /></div>
    <ExpenseList groupId={id} expenses={ex ?? []} members={members} me={user.id} isAdmin={isAdmin} />
    <SettlementHistory settlements={st ?? []} members={members} me={user.id} isAdmin={isAdmin} />
    <GroupAdmin groupId={id} name={g.name} archived={!!g.archived_at} me={user.id} isAdmin={isAdmin} isOwner={isOwner} roster={roster} invites={(inv ?? []) as any} />
    <details className="card"><summary className="sum"><span className="h-card">Activity</span></summary>{!act?.length && <p className="mt-2 text-sm text-muted">Nothing yet.</p>}<ul className="mt-2 space-y-1 text-xs text-muted">{act?.map((a: any) => <li key={a.id}>{new Date(a.created_at).toLocaleString()} · {a.actor ? name(a.actor) : "Someone"} · {a.action.replace(".", " ")}{a.detail?.title ? ` “${a.detail.title}”` : ""}{a.detail?.amount != null ? ` (${fmt(Number(a.detail.amount), a.detail.currency)})` : ""}</li>)}</ul></details>
  </div>);
}
