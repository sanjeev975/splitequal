"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Reset() {
  const r = useRouter(); const [state, setState] = useState<"checking" | "ready" | "invalid">("checking"); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { supabaseBrowser().auth.getSession().then(({ data }) => setState(data.session ? "ready" : "invalid")); }, []); // the /auth/callback step created this session from the email link
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(""); const { error } = await supabaseBrowser().auth.updateUser({ password: pw }); setBusy(false);
    if (error) return setMsg(error.message); r.push("/dashboard"); r.refresh();
  }
  return (<main className="mx-auto max-w-sm px-5 py-16"><div className="card space-y-3">
    {state === "checking" && <p>Checking your link…</p>}
    {state === "invalid" && <><h1 className="font-display text-2xl font-bold">This link isn't valid</h1><p className="text-sm">It may have expired, already been used, or been opened in a different browser than the one you asked from.</p><Link className="btn inline-block" href="/forgot">Request a new link</Link></>}
    {state === "ready" && <form onSubmit={save} className="space-y-3"><h1 className="font-display text-2xl font-bold">Choose a new password</h1>
      <input className="field" type="password" minLength={8} required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" />
      <button className="btn w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>{msg && <p role="alert" className="text-danger text-sm">{msg}</p>}</form>}
  </div></main>);
}
