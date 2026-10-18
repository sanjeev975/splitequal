"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Reset() {
  const r = useRouter(); const [pw, setPw] = useState(""); const [msg, setMsg] = useState("");
  return (<main className="mx-auto max-w-sm px-5 py-16"><form className="card space-y-3" onSubmit={async (e) => { e.preventDefault();
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw }); if (error) setMsg(error.message); else r.push("/dashboard"); }}>
    <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
    <input className="field" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" />
    <button className="btn w-full">Update password</button>{msg && <p role="alert" className="text-danger text-sm">{msg}</p>}</form></main>);
}
