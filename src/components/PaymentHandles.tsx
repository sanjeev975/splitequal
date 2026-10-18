"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isValidUpi, isValidVenmo, normalizeUpi } from "@/lib/payments";
export function PaymentHandles() {
  const sb = supabaseBrowser(); const [uid, setUid] = useState(""); const [upi, setUpi] = useState(""); const [venmo, setVenmo] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => { const { data: { user } } = await sb.auth.getUser(); if (!user) return; setUid(user.id);
    const { data } = await sb.from("payment_handles").select("upi_id,venmo_handle").eq("user_id", user.id).maybeSingle(); setUpi(data?.upi_id ?? ""); setVenmo(data?.venmo_handle ?? ""); })(); }, [sb]);
  const n = normalizeUpi(upi); const upiHint = !upi.trim() ? "" : isValidUpi(n) ? "✓ Looks good" : "Enter it like 9548967357@ibl or name@oksbi";
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); const v = venmo.trim().replace(/^@/, "");
    if (n && !isValidUpi(n)) return setMsg("That doesn't look like a UPI ID. Example: 9548967357@ibl or name@oksbi.");
    if (v && !isValidVenmo(v)) return setMsg("Venmo usernames are 5–30 letters, numbers, - or _.");
    const { error } = await sb.from("payment_handles").upsert({ user_id: uid, upi_id: n || null, venmo_handle: v || null, updated_at: new Date().toISOString() }); // raw UPI ID only
    if (!error) setUpi(n); setMsg(error ? error.message : "Saved.");
  }
  return (<form onSubmit={save} className="card space-y-3 max-w-md"><h2 className="font-display text-xl font-bold">Payment details</h2>
    <p className="text-sm">Optional. Lets people who owe you open their payment app with your details pre-filled. <b>Visible to members of groups you're in.</b></p>
    <label className="block text-sm">UPI ID (for INR)<input className="field" placeholder="9548967357@ibl or name@oksbi" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={upi} onChange={(e) => setUpi(e.target.value)} onBlur={() => setUpi(normalizeUpi(upi))} aria-describedby="upi-hint" /></label>
    <p id="upi-hint" className="text-xs -mt-2">Just your UPI ID — we build the payment link for you when someone settles up. {upiHint}</p>
    <label className="block text-sm">Venmo username (for USD)<input className="field" placeholder="@username" value={venmo} onChange={(e) => setVenmo(e.target.value)} /></label>
    <button className="btn">Save payment details</button>{msg && <p role="status" className="text-sm">{msg}</p>}</form>);
}
