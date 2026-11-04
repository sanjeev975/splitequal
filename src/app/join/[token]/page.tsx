"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
export default function Join() {
  const { token } = useParams<{ token: string }>(); const r = useRouter(); const sb = supabaseBrowser();
  const [authed, setAuthed] = useState<boolean | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { sb.auth.getUser().then(({ data }) => setAuthed(!!data.user)); }, [sb]);
  async function join() {
    setBusy(true); setErr(""); const { data, error } = await sb.rpc("accept_invite", { p_token: token }); setBusy(false);
    if (error) return setErr(error.message === "invalid invite" ? "This invite link isn't valid." : error.message);
    r.push(`/groups/${data}`);
  }
  return (<main className="mx-auto max-w-sm px-4 py-8"><Logo /><div className="card mt-4 space-y-3"><h1 className="font-display text-2xl font-bold">You've been invited to a group</h1>
    {authed === null ? <p>Checking…</p> : authed ? <button className="btn btn-coral w-full" onClick={join} disabled={busy}>{busy ? "Joining…" : "Join group"}</button>
      : <Link className="btn w-full block text-center" href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}>Sign in or sign up to join</Link>}
    {err && <p role="alert" className="text-danger text-sm">{err}</p>}</div></main>);
}
