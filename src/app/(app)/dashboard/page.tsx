import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { netPositions } from "@/lib/money/balances";
import { fmt } from "@/lib/format";
export default async function Dashboard() {
  const sb = await supabaseServer();
  // All independent queries run at the same time (was: one after another, each paying the full network latency to Supabase).
  const [{ data: { user } }, { data: groups }, { data: ex }, { data: st }, { data: profs }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("groups").select("id,name,base_currency").is("archived_at", null),
    sb.from("expenses").select("id,group_id,title,amount_minor,currency,expense_date,expense_payments(user_id,amount_minor),expense_splits(user_id,amount_minor)").order("expense_date", { ascending: false }).order("created_at", { ascending: false }),
    sb.from("settlements").select("id,group_id,from_user,to_user,amount_minor,currency,status").order("created_at", { ascending: false }),
    sb.from("profiles").select("id,display_name"),
  ]);
  if (!user) redirect("/login");
  const gname = (id: string) => groups?.find((g) => g.id === id)?.name ?? "Group";
  const pname = (id: string) => profs?.find((p) => p.id === id)?.display_name ?? "Someone";
  // Per (group, currency) net, then sum my positive/negative positions per currency. Currencies are never mixed.
  const keys = new Set<string>([...(ex ?? []).map((e: any) => `${e.group_id}|${e.currency}`), ...(st ?? []).map((s: any) => `${s.group_id}|${s.currency}`)]);
  const tot: Record<string, { owe: number; owed: number }> = {};
  for (const k of keys) {
    const [gid, cur] = k.split("|");
    const net = netPositions((ex ?? []).filter((e: any) => e.group_id === gid && e.currency === cur).map((e: any) => ({
      payments: e.expense_payments.map((p: any) => ({ userId: p.user_id, amount: Number(p.amount_minor) })), splits: e.expense_splits.map((p: any) => ({ userId: p.user_id, amount: Number(p.amount_minor) })) })),
      (st ?? []).filter((s: any) => s.group_id === gid && s.currency === cur).map((s: any) => ({ from: s.from_user, to: s.to_user, amount: Number(s.amount_minor), status: s.status })));
    const mine = net[user.id] ?? 0; const t = (tot[cur] ??= { owe: 0, owed: 0 });
    if (mine < 0) t.owe += -mine; else t.owed += mine;
  }
  // Personal share per month (what I actually owe for expenses) — not gross totals, not settlements.
  const month: Record<string, number> = {};
  for (const e of ex ?? []) for (const s of (e as any).expense_splits) if (s.user_id === user.id) { const k = `${(e as any).currency} ${(e as any).expense_date.slice(0, 7)}`; month[k] = (month[k] ?? 0) + Number(s.amount_minor); }
  const mrows = Object.entries(month).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6); const mmax = Math.max(1, ...mrows.map((r) => r[1]));
  if (!groups?.length) return <div className="card space-y-3"><h1 className="font-display text-3xl font-bold">Welcome to Splitequal</h1><p>No groups yet — create one to start sharing expenses.</p><Link className="btn btn-coral inline-block" href="/groups">Create a group</Link></div>;
  return (<div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="font-display text-3xl font-bold">Dashboard</h1><Link className="btn btn-coral" href="/add">+ Quick add expense</Link></div>
    {Object.keys(tot).length === 0 && <p className="card">No expenses yet. Open a group and add one.</p>}
    {Object.entries(tot).map(([cur, t]) => (<section key={cur} className="grid gap-3 sm:grid-cols-3" aria-label={`${cur} summary`}>
      <div className="inset"><p className="text-sm">You owe ({cur})</p><p className="font-mono text-2xl text-coral">{fmt(t.owe, cur)}</p></div>
      <div className="inset"><p className="text-sm">You are owed ({cur})</p><p className="font-mono text-2xl text-emerald">{fmt(t.owed, cur)}</p></div>
      <div className="inset"><p className="text-sm">Net ({cur})</p><p className="font-mono text-2xl">{t.owed - t.owe < 0 ? "−" : ""}{fmt(Math.abs(t.owed - t.owe), cur)}</p></div></section>))}
    <section className="card"><h2 className="font-display text-xl font-bold">Active groups</h2><ul className="mt-2 flex flex-wrap gap-2">{groups.map((g) => <li key={g.id}><Link className="underline" href={`/groups/${g.id}`}>{g.name}</Link></li>)}</ul></section>
    <section className="card"><h2 className="font-display text-xl font-bold">My monthly share</h2>{mrows.length === 0 && <p>No shares yet.</p>}
      {mrows.map(([k, v]) => <div key={k} className="mt-2 text-sm"><div className="flex justify-between"><span>{k}</span><span className="font-mono">{fmt(v, k.slice(0, 3))}</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-inset"><div className="h-full bg-primary" style={{ width: `${(v / mmax) * 100}%` }} /></div></div>)}</section>
    <section className="space-y-2"><h2 className="font-display text-xl font-bold">Recent expenses</h2>{(ex ?? []).slice(0, 5).map((e: any) => (
      <Link key={e.id} href={`/groups/${e.group_id}`} className="receipt block"><div className="flex justify-between font-bold"><span>{e.title}</span><span>{fmt(Number(e.amount_minor), e.currency)}</span></div><p className="text-sm">{gname(e.group_id)} · {e.expense_date}</p></Link>))}</section>
    <section className="card"><h2 className="font-display text-xl font-bold">Recent settlements</h2>{!st?.length && <p>None yet.</p>}
      {(st ?? []).slice(0, 5).map((s: any) => <p key={s.id} className="text-sm">{pname(s.from_user)} → {pname(s.to_user)} {fmt(Number(s.amount_minor), s.currency)} · {s.status} · {gname(s.group_id)}</p>)}</section>
  </div>);
}
