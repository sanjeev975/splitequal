"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PaymentHandles } from "@/components/PaymentHandles";
import { AvatarPicker } from "@/components/AvatarPicker";
import { SignOut } from "@/components/SignOut";
import { AccountData } from "@/components/AccountData";
const CUR = ["INR", "USD", "GBP", "EUR", "AED", "CAD", "AUD"];
export default function Profile() {
  const sb = supabaseBrowser(); const [uid, setUid] = useState(""); const [email, setEmail] = useState(""); const [f, setF] = useState({ display_name: "", username: "", default_currency: "INR", time_zone: "Asia/Kolkata" }); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => { const { data: { user } } = await sb.auth.getUser(); if (!user) return; setUid(user.id); setEmail(user.email ?? "");
    const { data } = await sb.from("profiles").select("display_name,username,default_currency,time_zone").eq("id", user.id).single(); if (data) setF({ ...data, username: data.username ?? "" }); })(); }, [sb]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const { error } = await sb.from("profiles").update({ ...f, username: f.username }).eq("id", uid);
    setMsg(error ? (error.code === "23505" ? "That username is taken." : error.code === "23514" ? "Username must be 3–20 letters, numbers or _." : error.message) : "Saved.");
  }
  const zones = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined ?? ["Asia/Kolkata", "UTC"];
  return (<div className="space-y-6"><AvatarPicker /><form onSubmit={save} className="card space-y-3 max-w-md"><h1 className="font-display text-2xl font-bold">Profile & settings</h1>
    <label className="block text-sm">Email<input className="field" readOnly value={email} aria-readonly="true" /></label><p className="text-xs -mt-2">The email you sign in with. It isn't shown to other members.</p>
    <label className="block text-sm">Display name<input className="field" required value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></label>
    <label className="block text-sm">Username<input className="field" required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
    <label className="block text-sm">Default currency<select className="field" value={f.default_currency} onChange={(e) => setF({ ...f, default_currency: e.target.value })}>{CUR.map((c) => <option key={c}>{c}</option>)}</select></label>
    <label className="block text-sm">Time zone<select className="field" value={f.time_zone} onChange={(e) => setF({ ...f, time_zone: e.target.value })}>{zones.map((z) => <option key={z}>{z}</option>)}</select></label>
    <button className="btn">Save</button>{msg && <p role="status" className="text-sm">{msg}</p>}</form><PaymentHandles /><AccountData /><section className="card max-w-md space-y-2"><h2 className="font-display text-xl font-bold">Session</h2><SignOut /></section></div>);
}
