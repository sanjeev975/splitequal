"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
const TYPES = ["Travel", "Rent and roommates", "Household", "Couples and family", "Dining", "Events", "Shopping", "Custom"];
const CUR = ["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"];
export function CreateGroup() {
  const r = useRouter(); const [name, setName] = useState(""); const [type, setType] = useState(TYPES[0]); const [cur, setCur] = useState("INR");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { data, error } = await supabaseBrowser().rpc("create_group", { p_name: name.trim(), p_type: type, p_currency: cur });
    setBusy(false); if (error) return setErr(error.message);
    r.push(`/groups/${data}`);
  }
  return (<form onSubmit={go} className="card flex flex-wrap gap-2 items-end">
    <label className="flex-1 min-w-40 text-sm">Group name<input className="field" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
    <label className="text-sm">Type<select className="field" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
    <label className="text-sm">Currency<select className="field" value={cur} onChange={(e) => setCur(e.target.value)}>{CUR.map((c) => <option key={c}>{c}</option>)}</select></label>
    <button className="btn btn-coral" disabled={busy}>{busy ? "Creating…" : "Create"}</button>{err && <p role="alert" className="w-full text-danger text-sm">{err}</p>}</form>);
}
