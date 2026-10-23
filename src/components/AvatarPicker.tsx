"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar, PRESETS } from "./Avatar";
async function toSquare(file: File, size: number): Promise<Blob> { // center-crop + resize in the browser (also strips EXIF/location data)
  const bmp = await createImageBitmap(file); const s = Math.min(bmp.width, bmp.height); const c = document.createElement("canvas"); c.width = c.height = size;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not process that image."))), "image/webp", 0.85));
}
export function AvatarPicker() {
  const sb = supabaseBrowser(); const [uid, setUid] = useState(""); const [name, setName] = useState(""); const [path, setPath] = useState<string | null>(null); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { (async () => { const { data: { user } } = await sb.auth.getUser(); if (!user) return; setUid(user.id);
    const { data } = await sb.from("profiles").select("avatar_path,display_name").eq("id", user.id).single(); setPath(data?.avatar_path ?? null); setName(data?.display_name ?? ""); })(); }, [sb]);
  async function save(value: string | null) {
    const { error } = await sb.from("profiles").update({ avatar_path: value }).eq("id", uid); if (error) { setMsg(error.message); return false; }
    const old = path; setPath(value); setMsg("Saved."); window.dispatchEvent(new Event("avatar-changed"));
    if (old && !old.startsWith("preset:") && old !== value) await sb.storage.from("avatars").remove([old]); // best effort cleanup
    return true;
  }
  async function upload(file?: File) {
    if (!file) return; setMsg("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setMsg("Please choose a JPG, PNG or WebP image.");
    if (file.size > 10 * 1024 * 1024) return setMsg("Please choose an image under 10 MB.");
    setBusy(true);
    try { const blob = await toSquare(file, 256); const ext = blob.type === "image/webp" ? "webp" : "png"; const p = `${uid}/${crypto.randomUUID()}.${ext}`;
      const up = await sb.storage.from("avatars").upload(p, blob, { contentType: blob.type }); if (up.error) throw up.error;
      if (!(await save(p))) await sb.storage.from("avatars").remove([p]);
    } catch (x) { setMsg((x as Error).message); } setBusy(false);
  }
  return (<section className="card space-y-3 max-w-md"><h2 className="h-card">Profile picture</h2>
    <div className="flex items-center gap-4"><Avatar path={path} name={name} size={64} />
      <div className="space-y-1"><label className="btn btn-sm inline-block cursor-pointer">{busy ? "Uploading…" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
        {path && <button className="block underline text-sm" onClick={() => save(null)}>Remove picture</button>}</div></div>
    <fieldset><legend className="text-sm font-semibold mb-1">Or pick an avatar</legend><div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => <button key={p.id} type="button" aria-label={`Avatar ${p.id}`} aria-pressed={path === `preset:${p.id}`} onClick={() => save(`preset:${p.id}`)} className={`rounded-full p-0.5 ${path === `preset:${p.id}` ? "ring-4 ring-volt" : ""}`}><Avatar path={`preset:${p.id}`} name="" size={36} /></button>)}</div></fieldset>
    <p className="text-xs">Photos are cropped to a square and shrunk on your device, and are visible only to people who share a group with you.</p>
    {msg && <p role="status" className="text-sm">{msg}</p>}</section>);
}
