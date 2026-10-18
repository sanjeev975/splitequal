"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";
type Mem = { user_id: string; name: string; username?: string; avatar?: string | null; shadow?: boolean; role: string };
type Inv = { id: string; expires_at: string; use_count: number };
export function GroupAdmin({ groupId, name, archived, me, isAdmin, isOwner, roster, invites }: { groupId: string; name: string; archived: boolean; me: string; isAdmin: boolean; isOwner: boolean; roster: Mem[]; invites: Inv[] }) {
  const r = useRouter(); const sb = supabaseBrowser(); const [link, setLink] = useState(""); const [newName, setNewName] = useState(name);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [guest, setGuest] = useState("");
  const run = async (p: PromiseLike<{ error: { message: string } | null }>, ok = "") => { setErr(""); setMsg(""); const { error } = await p; if (error) setErr(error.message); else { setMsg(ok); r.refresh(); } };
  async function mk() { setErr(""); const { data, error } = await sb.rpc("create_invite_link", { p_group: groupId, p_days: 7 }); if (error) return setErr(error.message); setLink(`${location.origin}/join/${data}`); r.refresh(); }
  const text = `Join "${name}" on Splitequal to split expenses fairly: ${link}`;
  return (<section className="card space-y-4"><h2 className="font-display text-xl font-bold">Members & sharing</h2>
    {archived && <p className="inset">This group is archived.</p>}
    <ul className="space-y-1">{roster.map((m) => (<li key={m.user_id} className="flex flex-wrap items-center gap-2 text-sm"><span className="flex flex-1 items-center gap-2"><Avatar path={m.avatar} name={m.name} size={28} />{m.name} {m.shadow ? <span className="rounded-full bg-lav px-2 py-0.5 text-xs" title="Hasn't joined Splitequal yet">Guest</span> : <span className="opacity-60">@{m.username}</span>} <i className="opacity-60">({m.role})</i>{m.user_id === me && " — you"}</span>
      {isOwner && m.user_id !== me && m.role !== "owner" && <button className="underline" onClick={() => run(sb.rpc("set_member_role", { p_group: groupId, p_user: m.user_id, p_role: m.role === "admin" ? "member" : "admin" }))}>{m.role === "admin" ? "Make member" : "Make admin"}</button>}
      {isOwner && m.user_id !== me && m.role !== "owner" && <button className="underline" onClick={() => confirm(`Make ${m.name} an owner?`) && run(sb.rpc("set_member_role", { p_group: groupId, p_user: m.user_id, p_role: "owner" }))}>Make owner</button>}
      {isAdmin && m.shadow && <button className="underline" onClick={() => { const n = window.prompt("Rename guest", m.name); if (n?.trim()) run(sb.rpc("rename_shadow_member", { p_user: m.user_id, p_name: n })); }}>Rename</button>}{isAdmin && m.user_id !== me && m.role !== "owner" && <button className="underline text-danger" onClick={() => confirm(`Remove ${m.name}?`) && run(sb.rpc("remove_member", { p_group: groupId, p_user: m.user_id }), "Member removed.")}>Remove</button>}</li>))}</ul>
    <button className="underline text-danger text-sm" onClick={async () => { if (!confirm("Leave this group?")) return; const { error } = await sb.rpc("remove_member", { p_group: groupId, p_user: me }); if (error) setErr(error.message); else r.push("/groups"); }}>Leave group</button>
    {isAdmin && <>
      <div className="inset space-y-2"><p className="font-semibold">Invite link (valid 7 days)</p><button className="btn !py-1" onClick={mk}>Create new link</button>
        {link && <><input readOnly className="field" value={link} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} />
          <div className="flex gap-2"><button className="btn !py-1" onClick={() => navigator.clipboard.writeText(link).then(() => setMsg("Link copied."))}>Copy</button>
            <a className="btn btn-coral !py-1" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></div>
          <p className="text-xs opacity-70">Shown once — for security only a hash is stored. Anyone with the link can join until it expires or is revoked.</p></>}
        {invites.map((i) => <p key={i.id} className="text-xs">Active link · expires {new Date(i.expires_at).toLocaleDateString()} · used {i.use_count}× <button className="underline text-danger" onClick={() => run(sb.rpc("revoke_invite", { p_id: i.id }), "Link revoked.")}>Revoke</button></p>)}</div>
      
      <form className="flex flex-wrap gap-2 items-end" onSubmit={(e) => { e.preventDefault(); run(sb.rpc("add_shadow_member", { p_group: groupId, p_name: guest }), "Guest added.").then(() => setGuest("")); }}><label className="flex-1 text-sm">Add a guest (no account needed)<input className="field" required maxLength={40} value={guest} onChange={(e) => setGuest(e.target.value)} /></label><button className="btn">Add guest</button></form>
      <form className="flex flex-wrap gap-2 items-end" onSubmit={(e) => { e.preventDefault(); run(sb.from("groups").update({ name: newName.trim() }).eq("id", groupId), "Renamed."); }}>
        <label className="flex-1 text-sm">Group name<input className="field" required maxLength={80} value={newName} onChange={(e) => setNewName(e.target.value)} /></label><button className="btn">Rename</button></form>
      <button className="btn btn-coral" onClick={() => confirm(archived ? "Restore this group?" : "Archive this group?") && run(sb.from("groups").update({ archived_at: archived ? null : new Date().toISOString() }).eq("id", groupId), archived ? "Restored." : "Archived.")}>{archived ? "Restore group" : "Archive group"}</button></>}
    {msg && <p role="status" className="text-sm">{msg}</p>}{err && <p role="alert" className="text-danger text-sm">{err}</p>}</section>);
}
