"use client";
import { useEffect, useState } from "react";
type T = "system" | "light" | "dark";
export function ThemeSetting() {
  const [t, setT] = useState<T>("system");
  useEffect(() => { try { const v = localStorage.getItem("splitequal.theme"); if (v === "light" || v === "dark") setT(v); } catch { /* storage blocked: stay on System */ } }, []);
  function pick(v: T) {
    setT(v);
    try { if (v === "system") { localStorage.removeItem("splitequal.theme"); delete document.documentElement.dataset.theme; } else { localStorage.setItem("splitequal.theme", v); document.documentElement.dataset.theme = v; } } catch { /* ignore */ }
  }
  return (<section className="card max-w-md space-y-2"><h2 className="font-display text-xl font-bold">Appearance</h2>
    <div role="radiogroup" aria-label="Theme" className="flex gap-2">{(["system", "light", "dark"] as T[]).map((v) => (
      <button key={v} type="button" role="radio" aria-checked={t === v} onClick={() => pick(v)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold capitalize ${t === v ? "border-primary bg-primary text-on" : "border-border bg-card"}`}>{v}</button>))}</div>
    <p className="text-xs text-muted">“System” follows your phone or computer setting.</p></section>);
}
