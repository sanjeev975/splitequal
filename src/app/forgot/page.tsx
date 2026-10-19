"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Turnstile, turnstileEnabled } from "@/components/Turnstile";
export default function Forgot() {
  const [email, setEmail] = useState(""); const [done, setDone] = useState(false); const [captcha, setCaptcha] = useState<string | null>(null); const [resetN, setResetN] = useState(0);
  return (<main className="mx-auto max-w-sm px-5 py-16"><form className="card space-y-3" onSubmit={async (e) => { e.preventDefault();
    await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset`, captchaToken: captcha ?? undefined }); setResetN((n) => n + 1); setDone(true); }}>
    <h1 className="font-display text-2xl font-bold">Reset password</h1>
    <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
    <Turnstile onToken={setCaptcha} resetKey={resetN} /><button className="btn w-full" disabled={turnstileEnabled && !captcha}>Send reset link</button>{done && <p role="status" className="text-sm">If an account exists for that email, a reset link is on its way.</p>}</form></main>);
}
