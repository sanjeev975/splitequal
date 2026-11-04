"use client";
import { useEffect, useRef } from "react";
declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: any) => string; reset: (id?: string) => void; remove: (id: string) => void } } }
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/** True when a site key is configured. Without one the widget is skipped (fine for local dev while Supabase CAPTCHA is off). */
export const turnstileEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
/** Cloudflare Turnstile widget. onToken gets a single-use token (or null when it expires/errs). Bump resetKey after each submit to get a fresh one. Pass a STABLE onToken (e.g. a useState setter). */
export function Turnstile({ onToken, resetKey }: { onToken: (t: string | null) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null); const id = useRef<string | null>(null);
  useEffect(() => {
    const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY; if (!site) return; let cancelled = false;
    const mount = () => { if (cancelled || !box.current || !window.turnstile || id.current) return;
      id.current = window.turnstile.render(box.current, { sitekey: site, theme: "light", callback: (t: string) => onToken(t), "expired-callback": () => onToken(null), "error-callback": () => onToken(null) }); };
    if (window.turnstile) mount(); else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
      if (!s) { s = document.createElement("script"); s.src = SRC; s.async = true; document.head.appendChild(s); }
      s.addEventListener("load", mount); }
    return () => { cancelled = true; if (id.current && window.turnstile) { window.turnstile.remove(id.current); id.current = null; } };
  }, [onToken]);
  useEffect(() => { if (resetKey && id.current && window.turnstile) { window.turnstile.reset(id.current); onToken(null); } }, [resetKey, onToken]);
  return turnstileEnabled ? <div ref={box} className="min-h-[65px]" aria-label="Security check" /> : null;
}
