"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Turnstile, turnstileEnabled } from "@/components/Turnstile";
export function AccountData() {
  const r = useRouter(); const [pw, setPw] = useState(""); const [word, setWord] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [blockers, setBlockers] = useState<string[]>([]); const [captcha, setCaptcha] = useState<string | null>(null); const [resetN, setResetN] = useState(0);
  async function del(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBlockers([]); setBusy(true);
    const res = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, confirm: word, captchaToken: captcha }) });
    const j = await res.json().catch(() => ({})); setBusy(false); setResetN((n) => n + 1);
    if (res.status === 409 && j.blockers) return setBlockers(j.blockers);
    if (!res.ok) return setErr(j.error ?? "Something went wrong.");
    await supabaseBrowser().auth.signOut(); r.push("/"); r.refresh();
  }
  return (<section className="card max-w-md space-y-3"><h2 className="h-card">Your data</h2>
    <p className="text-sm">Download a copy of your account, groups, expenses you took part in, settlements and notifications.</p>
    <a className="btn inline-block" href="/api/account/export" download>Download my data</a>
    <details className="inset"><summary className="cursor-pointer font-semibold text-danger">Delete my account</summary>
      <form onSubmit={del} className="mt-3 space-y-2"><p className="text-sm">This permanently closes your login and removes your name, username, picture, payment details, notifications and group memberships. Expenses you shared with other people stay in their groups (shown as “Former member”) because their balances depend on them. This can't be undone.</p>
        <input className="field" type="password" required placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Password" autoComplete="current-password" />
        <input className="field" required placeholder="Type DELETE to confirm" value={word} onChange={(e) => setWord(e.target.value)} aria-label="Type DELETE to confirm" />
        {!!blockers.length && <div role="alert" className="text-danger text-sm"><p className="font-semibold">Before you can delete your account:</p><ul className="list-disc pl-5">{blockers.map((b) => <li key={b}>{b}</li>)}</ul></div>}
        {err && <p role="alert" className="text-danger text-sm">{err}</p>}
        <Turnstile onToken={setCaptcha} resetKey={resetN} />
        <button className="btn btn-coral" disabled={busy || word !== "DELETE" || !pw || (turnstileEnabled && !captcha)}>{busy ? "Deleting…" : "Permanently delete my account"}</button></form></details></section>);
}
