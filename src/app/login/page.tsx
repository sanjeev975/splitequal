"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalPage";
import { Turnstile, turnstileEnabled } from "@/components/Turnstile";
import { safeNext } from "@/lib/safeNext";
export default function Login() {
  const r = useRouter(); const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPw] = useState(""); const [name, setName] = useState(""); const [username, setUsername] = useState("");
  const [msg, setMsg] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [uHint, setUHint] = useState("");
  const sb = supabaseBrowser(); const [captcha, setCaptcha] = useState<string | null>(null); const [resetN, setResetN] = useState(0);
  const [sent, setSent] = useState<{ email: string; kind: "new" | "unconfirmed" } | null>(null); const [cooldown, setCooldown] = useState(0); const [resendBusy, setResendBusy] = useState(false);
  const next = () => safeNext(new URLSearchParams(location.search).get("next"));
  const callback = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next())}`; // keeps invite links working through the email
  useEffect(() => { const sp = new URLSearchParams(location.search); if (sp.get("mode") === "up") setMode("up"); if (sp.get("next")) setNote("Please sign in or create an account to continue where you left off."); if (sp.get("error") === "link") setMsg("That link has expired, was already used, or was opened in a different browser. If you were confirming your email, try signing in. Otherwise request a new link."); }, []);
  useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);
  async function checkUser() {
    if (!username) return setUHint("");
    const { data } = await sb.rpc("username_available", { p_username: username });
    setUHint(data ? "✓ Username available" : "✗ Taken or invalid (3–20 letters, numbers, _)");
  }
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); if (turnstileEnabled && !captcha) return setMsg("Please complete the security check below."); setBusy(true);
    if (mode === "up") { const { data: ok } = await sb.rpc("username_available", { p_username: username }); if (!ok) { setBusy(false); return setMsg("That username is taken or invalid."); } }
    const { data, error } = mode === "in" ? await sb.auth.signInWithPassword({ email, password, options: { captchaToken: captcha ?? undefined } })
      : await sb.auth.signUp({ email, password, options: { captchaToken: captcha ?? undefined, data: { display_name: name, username }, emailRedirectTo: callback() } });
    setBusy(false); setResetN((n) => n + 1); // tokens are single-use
    if (error) {
      if (mode === "in" && (/not confirmed/i.test(error.message) || (error as any).code === "email_not_confirmed")) { setSent({ email, kind: "unconfirmed" }); setCooldown(0); return; }
      return setMsg(/captcha/i.test(error.message) ? "Security check failed. Please try again." : /database error/i.test(error.message) ? "That username or email can't be used. Try another." : /already registered/i.test(error.message) ? "An account with this email already exists. Sign in or reset your password." : error.message);
    }
    if (mode === "up" && data.user?.identities?.length === 0) return setMsg("An account with this email already exists. Sign in or reset your password.");
    if (mode === "up" && !data.session) { setPw(""); setNote(""); setSent({ email, kind: "new" }); setCooldown(60); return; } // confirmation email is on its way
    r.push(next()); r.refresh();
  }
  async function resend() {
    if (!sent || cooldown > 0 || resendBusy) return; setResendBusy(true); setMsg(""); setNote("");
    const { error } = await sb.auth.resend({ type: "signup", email: sent.email, options: { emailRedirectTo: callback(), captchaToken: captcha ?? undefined } });
    setResendBusy(false); setResetN((n) => n + 1);
    if (error) return setMsg(/captcha/i.test(error.message) ? "Security check failed. Please try again." : /rate limit|too many|seconds/i.test(error.message) ? "Too many emails were sent. Please wait a few minutes and try again." : error.message);
    setCooldown(60); setNote("We've sent it again.");
  }
  if (sent) return (<main className="mx-auto max-w-sm px-4 py-8"><Logo />
    <div className="card mt-4 space-y-3" role="status">
      <h1 className="font-display text-2xl font-bold text-emerald">{sent.kind === "new" ? "Check your email" : "Confirm your email first"}</h1>
      <p>{sent.kind === "new" ? "We sent a confirmation link to" : "Your account isn't active yet. We can send the confirmation link to"} <b className="break-all">{sent.email}</b>.</p>
      <ul className="list-disc space-y-1 pl-5 text-sm"><li>It can take a minute or two to arrive.</li><li>Look in your spam or promotions folder.</li><li>Open the link in this same browser if you can.</li></ul>
      {note && <p className="text-sm text-emerald">{note}</p>}{msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
      <Turnstile onToken={setCaptcha} resetKey={resetN} />
      <button className="btn w-full" onClick={resend} disabled={cooldown > 0 || resendBusy || (turnstileEnabled && !captcha)}>{resendBusy ? "Sending…" : cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}</button>
      <button className="block text-sm underline" onClick={() => { setSent(null); setMsg(""); setNote(""); }}>{sent.kind === "new" ? "Wrong email? Go back" : "Back to sign in"}</button>
    </div><LegalFooter /></main>);
  return (<main className="mx-auto max-w-sm px-4 py-8"><Logo />
    <form onSubmit={go} className="card mt-4 space-y-3">
      <h1 className="font-display text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create account"}</h1>
      {mode === "up" && <><input className="field" placeholder="Display name" required value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
        <input className="field" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} onBlur={checkUser} aria-label="Username" />{uHint && <p className="text-sm" role="status">{uHint}</p>}</>}
      <input className="field" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
      <input className="field" type="password" placeholder="Password (min 8)" minLength={8} required value={password} onChange={(e) => setPw(e.target.value)} aria-label="Password" />
      {note && <p className="text-sm text-muted">{note}</p>}
      {msg && <p role="alert" className="text-danger text-sm">{msg}</p>}
      <Turnstile onToken={setCaptcha} resetKey={resetN} />
      <button className="btn w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
      {mode === "up" && <p className="text-xs">By signing up you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>}
      <button type="button" className="text-sm underline block" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}</button>
      {mode === "in" && <Link href="/forgot" className="text-sm underline block">Forgot password?</Link>}
    </form><LegalFooter /></main>);
}
