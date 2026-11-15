"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const TYPES = ["Travel", "Rent and roommates", "Household", "Couples and family", "Dining", "Events", "Shopping", "Custom"];
const CUR = ["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"];

export function CreateGroup() {
  const [open, setOpen] = useState(false);
  const r = useRouter(); const [name, setName] = useState(""); const [type, setType] = useState(TYPES[0]); const [cur, setCur] = useState("INR");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { data, error } = await supabaseBrowser().rpc("create_group", { p_name: name.trim(), p_type: type, p_currency: cur });
    setBusy(false); if (error) return setErr(error.message);
    r.push(`/groups/${data}`);
  }

  if (!open) return <button className="btn w-full" onClick={() => setOpen(true)}>+ New group</button>;

  return (
    <form onSubmit={go} className="card space-y-3">
      <h2 className="h-card">Create new group</h2>
      <label className="block text-sm">Group name<input className="field" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="flex gap-2">
        <label className="flex-1 text-sm">Type<select className="field" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="w-24 text-sm">Currency<select className="field" value={cur} onChange={(e) => setCur(e.target.value)}>{CUR.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn bg-muted/20 text-fg" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-lime flex-1" disabled={busy}>{busy ? "Creating…" : "Create group"}</button>
      </div>
      {err && <p role="alert" className="text-danger text-sm">{err}</p>}
    </form>
  );
}
