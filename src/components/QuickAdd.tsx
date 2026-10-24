"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AddExpense } from "./ExpenseForm";
import { NEW_GROUP, PERSONAL, defaultSelection } from "@/lib/quickAdd";
type G = { id: string; name: string; type: string; base_currency: string }; type M = { user_id: string; name: string };
const KEY = "splitequal.quickadd.group"; const CUR = ["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"];
const TYPES = ["Travel", "Rent and roommates", "Household", "Couples and family", "Dining", "Events", "Shopping", "Custom"];
/** The "Add" tab: pick where the expense goes (just me / a group / a brand-new group) and fill in the form, all on one screen. */
export function QuickAdd({ groups: g0, membersByGroup: m0, me, initial }: { groups: G[]; membersByGroup: Record<string, M[]>; me: string; initial: string }) {
  const sb = supabaseBrowser();
  const [groups, setGroups] = useState(g0); const [mbg, setMbg] = useState(m0); const [sel, setSel] = useState(initial || defaultSelection({ groups: g0 }));
  const [saved, setSaved] = useState(""); const [n, setN] = useState(0); const [cur, setCur] = useState("INR"); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [name, setName] = useState(""); const [type, setType] = useState(TYPES[0]); const creating = useRef(false);
  const personal = groups.find((g) => g.type === "Personal"); const shared = groups.filter((g) => g.type !== "Personal");
  useEffect(() => { sb.from("profiles").select("default_currency").eq("id", me).maybeSingle().then(({ data }) => { if (data?.default_currency) setCur(data.default_currency); }); }, [sb, me]);
  useEffect(() => { if (initial) return; try { setSel(defaultSelection({ groups: g0, last: localStorage.getItem(KEY) })); } catch { /* storage blocked: keep default */ } }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // Personal chosen (or defaulted to, e.g. no groups yet) but the space doesn't exist yet: create it, once
    if (sel !== PERSONAL || personal || creating.current) return; creating.current = true; setBusy(true);
    sb.rpc("get_or_create_personal_group", { p_currency: cur }).then(({ data, error }) => { creating.current = false; setBusy(false);
      if (error) return setErr(error.message);
      const g: G = { id: data as string, name: "Personal", type: "Personal", base_currency: cur };
      setGroups((x) => (x.some((y) => y.id === g.id) ? x : [...x, g])); setMbg((x) => ({ ...x, [g.id]: [{ user_id: me, name: "You" }] })); });
  }, [sel, personal]); // eslint-disable-line react-hooks/exhaustive-deps
  const remember = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* ignore */ } };
  const choose = (v: string) => { setSaved(""); setErr(""); setSel(v); if (v !== NEW_GROUP) remember(v); };
  async function createGroup(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); const { data, error } = await sb.rpc("create_group", { p_name: name.trim(), p_type: type, p_currency: cur }); setBusy(false);
    if (error) return setErr(error.message);
    const g: G = { id: data as string, name: name.trim(), type, base_currency: cur };
    setGroups((x) => [...x, g]); setMbg((x) => ({ ...x, [g.id]: [{ user_id: me, name: "You" }] })); setName(""); setSel(g.id); remember(g.id);
  }
  const g = sel === PERSONAL ? personal : shared.find((x) => x.id === sel); const members = g ? mbg[g.id] ?? [] : [];
  const done = () => { setSaved(g?.name ?? ""); setN((x) => x + 1); };
  return (<div className="space-y-3">
    <label className="block"><span className="h-sec">Add to</span>
      <select className="field mt-1" value={sel} onChange={(e) => choose(e.target.value)}>
        <option value={PERSONAL}>Personal (just me)</option>
        {shared.length > 0 && <optgroup label="Shared groups">{shared.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.base_currency}</option>)}</optgroup>}
        <option value={NEW_GROUP}>＋ Create a new group…</option></select></label>
    {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    {saved && <p role="status" className="inset flex items-center justify-between gap-2 text-sm"><span>✓ Saved to {saved}</span>{g && g.type !== "Personal" && <Link className="underline" href={`/groups/${g.id}`}>View group</Link>}</p>}
    {sel === NEW_GROUP ? (
      <form onSubmit={createGroup} className="card space-y-2"><h2 className="h-card">New group</h2>
        <input className="field" required maxLength={80} placeholder="Group name (e.g. Goa trip)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Group name" />
        <div className="grid grid-cols-2 gap-2"><select className="field" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <select className="field" value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Currency">{CUR.map((c) => <option key={c}>{c}</option>)}</select></div>
        <button className="btn btn-coral w-full" disabled={busy}>{busy ? "Creating…" : "Create group"}</button></form>
    ) : !g ? <p className="text-sm text-muted">{busy ? "Setting up your personal space…" : "Choose where to add this expense."}</p>
    : g.type === "Personal" ? (<><p className="text-xs text-muted">🔒 Only you can see personal expenses, and they can’t be shared or split.</p>
        <AddExpense key={`${g.id}-${n}`} personal groupId={g.id} currency={g.base_currency} members={[{ user_id: me, name: "You" }]} me={me} onDone={done} /></>)
    : members.length < 2 ? <AddPeople group={g} onAdded={(added) => setMbg((x) => ({ ...x, [g.id]: [...(x[g.id] ?? []), ...added] }))} />
    : <AddExpense key={`${g.id}-${n}`} groupId={g.id} currency={g.base_currency} members={members} me={me} onDone={done} />}
  </div>);
}
function AddPeople({ group, onAdded }: { group: G; onAdded: (m: M[]) => void }) {
  const sb = supabaseBrowser(); const [names, setNames] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); const added: M[] = [];
    for (const nm of names.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10)) {
      const { data, error } = await sb.rpc("add_shadow_member", { p_group: group.id, p_name: nm }); if (error) { setErr(`${nm}: ${error.message}`); break; }
      added.push({ user_id: data as string, name: nm.slice(0, 40) });
    }
    setBusy(false); if (added.length) { setNames(""); onAdded(added); }
  }
  return (<form onSubmit={add} className="card space-y-2 text-sm"><p><b>“{group.name}”</b> only has you in it. Who are you splitting with?</p>
    <input className="field" placeholder="Names, separated by commas (e.g. Ravi, Meera)" value={names} onChange={(e) => setNames(e.target.value)} aria-label="Names of people to add" />
    {err && <p role="alert" className="text-danger">{err}</p>}
    <div className="flex flex-wrap items-center gap-2"><button className="btn" disabled={busy || !names.trim()}>{busy ? "Adding…" : "Add people"}</button><Link className="underline" href={`/groups/${group.id}`}>Or invite them with a link</Link></div>
    <p className="text-xs text-muted">People added by name are “Guests” until they join with an account.</p></form>);
}
