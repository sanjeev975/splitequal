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
  if (!user) redirect("/login?next=%2Fdashboard");
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
  return (<div className="space-y-4">
    <div className="flex items-center justify-between gap-2"><h1 className="font-display text-2xl font-bold">Dashboard</h1><Link className="btn btn-coral btn-sm" href="/add">+ Add expense</Link></div>
    {Object.keys(tot).length === 0 && <p className="card text-sm">No expenses yet. Open a group and add one.</p>}
    {Object.entries(tot).map(([cur, t]) => (<section key={cur} aria-label={`${cur} summary`} className="no-scrollbar -mx-3 flex snap-x gap-2 overflow-x-auto px-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {[["You owe", fmt(t.owe, cur), "text-accent"], ["You are owed", fmt(t.owed, cur), "text-good"], ["Net", `${t.owed - t.owe < 0 ? "−" : ""}${fmt(Math.abs(t.owed - t.owe), cur)}`, ""]].map(([l, v, c]) => (
        <div key={l} className="inset min-w-[8.5rem] flex-1 snap-start"><p className="text-xs text-muted">{l} <span className="chip !px-1.5 !py-0">{cur}</span></p><p className={`font-mono text-lg font-bold ${c}`}>{v}</p></div>))}</section>))}
    <section><h2 className="h-sec mb-1.5">Groups</h2><div className="flex flex-wrap gap-1.5">{groups.map((g) => <Link key={g.id} href={`/groups/${g.id}`} className="chip-link">{g.name}</Link>)}</div></section>
    <section className="card"><h2 className="h-card">My monthly share</h2>{mrows.length === 0 && <p className="mt-1 text-sm text-muted">No shares yet.</p>}
      {mrows.map(([k, v]) => <div key={k} className="mt-2 text-sm"><div className="flex justify-between"><span className="text-muted">{k}</span><span className="font-mono font-semibold">{fmt(v, k.slice(0, 3))}</span></div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-inset"><div className="h-full bg-primary" style={{ width: `${(v / mmax) * 100}%` }} /></div></div>)}</section>
    <section className="card !p-0"><h2 className="h-sec px-3.5 pb-1 pt-3">Recent expenses</h2>{!(ex ?? []).length && <p className="px-3.5 pb-3 text-sm text-muted">Nothing yet.</p>}
      <ul className="divide-y divide-border">{(ex ?? []).slice(0, 5).map((e: any) => (<li key={e.id}><Link href={`/groups/${e.group_id}`} className="flex min-h-[44px] items-center justify-between gap-3 px-3.5 py-2">
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="block truncate text-xs text-muted">{gname(e.group_id)} · {e.expense_date}</span></span>
        <span className="shrink-0 font-mono text-sm font-bold">{fmt(Number(e.amount_minor), e.currency)}</span></Link></li>))}</ul></section>
    <section className="card !p-0"><h2 className="h-sec px-3.5 pb-1 pt-3">Recent payments</h2>{!st?.length && <p className="px-3.5 pb-3 text-sm text-muted">None yet.</p>}
      <ul className="divide-y divide-border">{(st ?? []).slice(0, 5).map((s: any) => (<li key={s.id} className="flex min-h-[44px] items-center justify-between gap-3 px-3.5 py-2 text-sm">
        <span className="min-w-0 truncate">{pname(s.from_user)} → {pname(s.to_user)} <span className="text-xs text-muted">· {gname(s.group_id)}</span></span>
        <span className="flex shrink-0 items-center gap-2"><span className="font-mono font-semibold">{fmt(Number(s.amount_minor), s.currency)}</span><span className="chip">{s.status}</span></span></li>))}</ul></section>
  </div>);
}
