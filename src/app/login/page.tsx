"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
export default function Login() {
  const r = useRouter(); const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPw] = useState(""); const [name, setName] = useState(""); const [username, setUsername] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [uHint, setUHint] = useState("");
  const sb = supabaseBrowser();
  async function checkUser() {
    if (!username) return setUHint("");
    const { data } = await sb.rpc("username_available", { p_username: username });
    setUHint(data ? "✓ Username available" : "✗ Taken or invalid (3–20 letters, numbers, _)");
  }
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    if (mode === "up") { const { data: ok } = await sb.rpc("username_available", { p_username: username }); if (!ok) { setBusy(false); return setMsg("That username is taken or invalid."); } }
    const { data, error } = mode === "in" ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { data: { display_name: name, username }, emailRedirectTo: `${location.origin}/dashboard` } });
    setBusy(false);
    if (error) return setMsg(/database error/i.test(error.message) ? "That username or email can't be used. Try another." : /already registered/i.test(error.message) ? "An account with this email already exists. Sign in or reset your password." : error.message);
    if (mode === "up" && data.user?.identities?.length === 0) return setMsg("An account with this email already exists. Sign in or reset your password.");
    if (mode === "up" && !data.session) return setMsg("Check your email to verify your account, then sign in.");
    const next = new URLSearchParams(location.search).get("next");
    r.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"); r.refresh();
  }
  return (<main className="mx-auto max-w-sm px-5 py-16"><Logo />
    <form onSubmit={go} className="card mt-6 space-y-3">
      <h1 className="font-display text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create account"}</h1>
      {mode === "up" && <><input className="field" placeholder="Display name" required value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
        <input className="field" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} onBlur={checkUser} aria-label="Username" />{uHint && <p className="text-sm" role="status">{uHint}</p>}</>}
      <input className="field" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
      <input className="field" type="password" placeholder="Password (min 8)" minLength={8} required value={password} onChange={(e) => setPw(e.target.value)} aria-label="Password" />
      {msg && <p role="alert" className="text-danger text-sm">{msg}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
      <button type="button" className="text-sm underline block" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</button>
      {mode === "in" && <Link href="/forgot" className="text-sm underline block">Forgot password?</Link>}
    </form></main>);
}
