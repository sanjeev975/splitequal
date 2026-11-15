"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabaseBrowser } from "@/lib/supabase/client";
import { byCategory, byMember, byMonth, topN, totals, type Ex } from "@/lib/analytics";
import { fmt } from "@/lib/format";
import { useChartColors } from "@/lib/useChartColors";
const compact = (minor: number) => (minor / 100).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 });
type Row = Ex & { id: string };
export function AnalyticsClient() {
  const colors = useChartColors();
  const sb = supabaseBrowser(); const [me, setMe] = useState(""); const [rows, setRows] = useState<Row[] | null>(null); const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [profs, setProfs] = useState<{ id: string; display_name: string; username: string | null }[]>([]);
  const [group, setGroup] = useState(""); const [cur, setCur] = useState(""); const [range, setRange] = useState("3m"); const [mode, setMode] = useState<"total" | "mine">("total"); const [err, setErr] = useState("");
  useEffect(() => { (async () => {
    const { data: { user } } = await sb.auth.getUser(); if (!user) return; setMe(user.id);
    const [g, e, p] = await Promise.all([sb.from("groups").select("id,name"), sb.from("expenses").select("id,group_id,currency,expense_date,category,amount_minor,expense_payments(user_id,amount_minor),expense_splits(user_id,amount_minor)").order("expense_date", { ascending: false }).limit(5000), sb.from("profiles").select("id,display_name,username")]);
    if (e.error) return setErr(e.error.message); setGroups(g.data ?? []); setProfs(p.data ?? []); setRows((e.data ?? []) as unknown as Row[]);
    const c = [...new Set<string>((e.data ?? []).map((x: any) => x.currency as string))]; setCur(c.includes("INR") ? "INR" : c[0] ?? "INR"); })(); }, [sb]);
  const currencies = useMemo(() => [...new Set((rows ?? []).map((r) => r.currency))], [rows]);
  const from = useMemo(() => { const d = new Date(); if (range === "month") d.setDate(1); else if (range === "3m") { d.setMonth(d.getMonth() - 2); d.setDate(1); } else if (range === "year") { d.setMonth(0); d.setDate(1); } else return ""; return d.toISOString().slice(0, 10); }, [range]);
  const ex = useMemo(() => (rows ?? []).filter((r) => r.currency === cur && (!group || r.group_id === group) && (!from || r.expense_date >= from)), [rows, cur, group, from]);
  const name = (id: string) => { const p = profs.find((x) => x.id === id); if (!p) return "Former member"; return profs.some((o) => o.id !== id && o.display_name.toLowerCase() === p.display_name.toLowerCase()) ? `${p.display_name} (@${p.username})` : p.display_name; };
  const cats = useMemo(() => topN(byCategory(ex, mode, me)), [ex, mode, me]); const members = useMemo(() => Object.entries(byMember(ex)).map(([id, v]) => ({ name: name(id), Paid: v.paid, Owed: v.owed })), [ex, profs]); // eslint-disable-line react-hooks/exhaustive-deps
  const months = useMemo(() => byMonth(ex, me).map((m) => ({ month: m.month, "Total spent": m.total, "My share": m.mine })), [ex, me]); const t = totals(ex, me); const catTotal = cats.reduce((a, c) => a + c.value, 0);
  const tip = { formatter: (v: any) => fmt(Number(v), cur), contentStyle: { borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--card))", color: "rgb(var(--fg))" } };
  const total = cats.reduce((a, c) => a + c.value, 0);
  if (err) return <p role="alert" className="card text-danger">{err}</p>;
  if (rows === null || !colors) return <p className="card">Loading analytics…</p>;
  if (!rows.length) return <div className="card space-y-2"><h1 className="font-display text-3xl font-bold">Analytics</h1><p>No expenses yet — add some in a group and your charts will appear here.</p><Link className="btn inline-block" href="/groups">Go to groups</Link></div>;
  return (<div className="space-y-3.5"><h1 className="font-display text-3xl font-bold">Analytics</h1>
    <div className="card grid grid-cols-2 gap-2 sm:grid-cols-4">
      <label className="text-sm">Group<select className="field" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <label className="text-sm">Currency<select className="field" value={cur} onChange={(e) => setCur(e.target.value)}>{currencies.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="text-sm">Period<select className="field" value={range} onChange={(e) => setRange(e.target.value)}><option value="month">This month</option><option value="3m">Last 3 months</option><option value="year">This year</option><option value="all">All time</option></select></label>
      <label className="text-sm">Categories show<select className="field" value={mode} onChange={(e) => setMode(e.target.value as "total" | "mine")}><option value="total">Total spent</option><option value="mine">My share</option></select></label></div>
    <p className="text-xs">One currency at a time — amounts in different currencies are never added together. Settlements are payments between people, not spending, so they are excluded.</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Total spent", fmt(t.spent, cur)], ["My share", fmt(t.share, cur)], ["I paid", fmt(t.paid, cur)], ["Expenses", String(t.count)]].map(([l, v]) => <div key={l} className="inset"><p className="text-xs text-muted">{l}</p><p className="font-mono text-base font-bold">{v}</p></div>)}</div>
    {!ex.length ? <p className="card">No {cur} expenses in this period.</p> : <>
      <section className="card"><h2 className="h-card">Spending by category <span className="text-sm font-normal">({mode === "total" ? "total spent" : "my share"})</span></h2>
        <div className="h-64 w-full sm:h-72 relative" role="img" aria-label="Donut chart of spending by category; the same data is in the list and table below">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie data={cats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} stroke="none">
                        {cats.map((_, i) => <Cell key={i} fill={colors.series[i % colors.series.length]} />)}
                    </Pie>
                    <Tooltip {...tip} />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-muted uppercase tracking-wider">Total</p>
                <p className="font-mono text-xl font-bold">{fmt(total, cur)}</p>
            </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-inset hover:bg-soft transition">
                    <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: colors.series[i % colors.series.length] }} />
                        <span className="font-medium text-fg">{c.name}</span>
                    </span>
                    <span className="font-mono text-muted">{fmt(c.value, cur)}</span>
                </li>
            ))}
        </ul>
        <details className="text-sm mt-4"><summary className="cursor-pointer text-muted font-medium hover:text-fg">View details table</summary>
            <table className="w-full mt-2 text-left"><thead><tr className="border-b border-border"><th className="pb-2 text-sm">Category</th><th className="pb-2 text-right text-sm">Amount</th><th className="pb-2 text-right text-sm">%</th></tr></thead>
            <tbody>{cats.map((c) => <tr key={c.name} className="border-b border-border/50"><td className="py-2">{c.name}</td><td className="text-right font-mono py-2">{fmt(c.value, cur)}</td><td className="text-right py-2">{Math.round((c.value / total) * 100)}%</td></tr>)}</tbody></table></details></section>
      <section className="card"><h2 className="h-card">Who paid vs who owes</h2><p className="text-xs">Paid = money each person actually put in. Owed = their share of the costs.</p>
        <div className="h-56 sm:h-72"><ResponsiveContainer><BarChart data={members}><CartesianGrid strokeDasharray="3 3" stroke={colors.grid} /><XAxis dataKey="name" tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.grid} /><YAxis tickFormatter={compact} width={48} tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.grid} /><Tooltip {...tip} /><Legend wrapperStyle={{ color: colors.text }} /><Bar dataKey="Paid" fill={colors.primary} radius={[8, 8, 0, 0]} /><Bar dataKey="Owed" fill={colors.accent} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="card"><h2 className="h-card">Monthly spending</h2>
        <div className="h-56 sm:h-72"><ResponsiveContainer><BarChart data={months}><CartesianGrid strokeDasharray="3 3" stroke={colors.grid} /><XAxis dataKey="month" tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.grid} /><YAxis tickFormatter={compact} width={48} tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.grid} /><Tooltip {...tip} /><Legend wrapperStyle={{ color: colors.text }} /><Bar dataKey="Total spent" fill={colors.primary} radius={[8, 8, 0, 0]} /><Bar dataKey="My share" fill={colors.good} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></section></>}</div>);
}
