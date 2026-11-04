"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
const OK = ["image/jpeg", "image/png", "image/webp", "application/pdf"]; const MAX = 5 * 1024 * 1024;
export async function uploadReceipt(sb: SupabaseClient, groupId: string, expenseId: string, file: File) {
  if (!OK.includes(file.type)) throw new Error("Receipts must be JPG, PNG, WebP or PDF.");
  if (file.size > MAX) throw new Error("Receipt must be 5 MB or smaller.");
  const path = `${groupId}/${expenseId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80)}`;
  const up = await sb.storage.from("receipts").upload(path, file, { contentType: file.type }); if (up.error) throw up.error;
  const { error } = await sb.from("expense_attachments").insert({ expense_id: expenseId, path, file_name: file.name, mime_type: file.type, size_bytes: file.size });
  if (error) { await sb.storage.from("receipts").remove([path]); throw error; }
}
export function Receipts({ groupId, expenseId, files, canEdit }: { groupId: string; expenseId: string; files: any[]; canEdit: boolean }) {
  const r = useRouter(); const sb = supabaseBrowser(); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function view(path: string) { const { data, error } = await sb.storage.from("receipts").createSignedUrl(path, 60); if (error) return setErr(error.message); window.open(data.signedUrl, "_blank", "noopener"); }
  async function del(a: any) {
    if (!confirm(`Delete receipt "${a.file_name}"?`)) return;
    const { error } = await sb.from("expense_attachments").delete().eq("id", a.id); if (error) return setErr(error.message);
    await sb.storage.from("receipts").remove([a.path]); r.refresh();
  }
  async function add(f?: File) { if (!f) return; setBusy(true); setErr(""); try { await uploadReceipt(sb, groupId, expenseId, f); r.refresh(); } catch (x) { setErr((x as Error).message); } setBusy(false); }
  return (<div className="mt-2 text-sm font-sans"><p className="font-semibold">Receipts</p>{!files.length && <p className="opacity-70">None attached.</p>}
    {files.map((a) => <p key={a.id}>📎 <button className="underline" onClick={() => view(a.path)}>{a.file_name}</button>{canEdit && <button className="ml-2 text-danger underline" onClick={() => del(a)}>Delete</button>}</p>)}
    {canEdit && <label className="block mt-1">{busy ? "Uploading…" : <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { add(e.target.files?.[0]); e.target.value = ""; }} aria-label="Attach receipt" />}</label>}
    {err && <p role="alert" className="text-danger">{err}</p>}</div>);
}
