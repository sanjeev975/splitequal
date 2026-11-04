"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cleanGroup, newId, useGuestGroups } from "@/lib/guest/store";
import type { LocalGroup } from "@/lib/guestMigration";
const TYPES = ["Travel", "Rent and roommates", "Household", "Couples and family", "Dining", "Events", "Shopping", "Custom"]; const CUR = ["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"];
export default function GuestHome() {
  const r = useRouter(); const { groups, update } = useGuestGroups(); const [name, setName] = useState(""); const [type, setType] = useState("Travel"); const [cur, setCur] = useState("INR");
  const [me, setMe] = useState(""); const [others, setOthers] = useState(""); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  function create(e: React.FormEvent) {
    e.preventDefault(); setErr(""); const people = [me, ...others.split(",")].map((s) => s.trim().slice(0, 40)).filter(Boolean);
    if (new Set(people.map((p) => p.toLowerCase())).size !== people.length) return setErr("Each person needs a different name.");
    const members = people.map((n) => ({ id: newId(), name: n })); const g: LocalGroup = { id: newId(), name: name.trim().slice(0, 80), type, currency: cur, me: members[0].id, members, expenses: [], settlements: [] };
    update((gs) => [g, ...gs]); r.push(`/guest/${g.id}`);
  }
  function exportBackup() { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(groups ?? [], null, 2)], { type: "application/json" })); a.download = "splitequal-guest-backup.json"; a.click(); URL.revokeObjectURL(a.href); }
  async function importBackup(f?: File) {
    if (!f) return; setMsg(""); try { const v = JSON.parse(await f.text()); const list = (Array.isArray(v) ? v : []).map(cleanGroup); if (!list.length || list.includes(null)) return setMsg("That file isn't a valid Splitequal backup.");
      update((gs) => { const have = new Set(gs.map((g) => g.id)); return [...(list as LocalGroup[]).filter((g) => !have.has(g.id)), ...gs]; }); setMsg("Backup restored."); } catch { setMsg("Couldn't read that file."); }
  }
  return (<div className="space-y-3.5"><h1 className="font-display text-3xl font-bold">Your guest groups</h1>
    <form onSubmit={create} className="card space-y-3"><h2 className="h-card">New group</h2>
      <div className="grid gap-2 sm:grid-cols-3"><input className="field sm:col-span-3" required maxLength={80} placeholder="Group name (e.g. Goa trip)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Group name" />
        <select className="field" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="field" value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Currency">{CUR.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="field" required maxLength={40} placeholder="Your name" value={me} onChange={(e) => setMe(e.target.value)} aria-label="Your name" />
        <input className="field sm:col-span-3" placeholder="Other people, separated by commas (e.g. Ravi, Meera)" value={others} onChange={(e) => setOthers(e.target.value)} aria-label="Other people" /></div>
      {err && <p role="alert" className="text-danger text-sm">{err}</p>}<button className="btn btn-coral">Create group</button></form>
    {groups === null ? <p>Loading…</p> : !groups.length ? <p className="card">No guest groups yet. Create one above, or restore a backup below.</p> :
      <ul className="grid gap-3 sm:grid-cols-2">{groups.map((g) => <li key={g.id}><Link href={`/guest/${g.id}`} className="card block hover:-translate-y-0.5 transition"><p className="font-display text-xl font-bold">{g.name}</p><p className="text-sm opacity-70">{g.type} · {g.currency} · {g.members.length} people · {g.expenses?.length ?? 0} expenses</p></Link></li>)}</ul>}
    <section className="card flex flex-wrap items-center gap-3"><button className="btn" onClick={exportBackup} disabled={!groups?.length}>Export backup</button>
      <label className="text-sm">Restore backup <input type="file" accept="application/json,.json" onChange={(e) => { importBackup(e.target.files?.[0]); e.target.value = ""; }} /></label>{msg && <p role="status" className="text-sm">{msg}</p>}</section></div>);
}
