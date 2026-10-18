"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Notifications() {
  const r = useRouter(); const sb = supabaseBrowser(); const [items, setItems] = useState<any[] | null>(null); const [unreadOnly, setUnreadOnly] = useState(false);
  const load = useCallback(async () => { const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50); setItems(data ?? []); }, [sb]);
  useEffect(() => { let cancelled = false; let ch: ReturnType<typeof sb.channel> | undefined; load();
    sb.auth.getUser().then(({ data: { user } }) => { if (!user || cancelled) return;
      ch = sb.channel(`notif-page:${user.id}:${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe(); });
    return () => { cancelled = true; if (ch) sb.removeChannel(ch); }; }, [sb, load]);
  const shown = (items ?? []).filter((n) => !unreadOnly || !n.read_at);
  async function open(n: any) { if (!n.read_at) await sb.rpc("mark_notifications_read", { p_ids: [n.id] }); if (n.link) r.push(n.link); else load(); }
  return (<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="font-display text-3xl font-bold">Notifications</h1>
    <div className="flex items-center gap-3"><label className="text-sm flex gap-1"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Unread only</label>
      <button className="btn !py-1" onClick={async () => { await sb.rpc("mark_notifications_read", { p_ids: null }); load(); }}>Mark all read</button></div></div>
    {items === null ? <p>Loading…</p> : !shown.length ? <p className="card">{unreadOnly ? "No unread notifications." : "Nothing yet — activity in your groups will show up here."}</p> :
      shown.map((n) => (<button key={n.id} onClick={() => open(n)} className={`card block w-full text-left ${n.read_at ? "opacity-70" : "border-l-4 border-l-coral"}`}>
        <p className={n.read_at ? "" : "font-bold"}>{n.title}</p><p className="text-sm">{n.body}</p><p className="text-xs opacity-60">{new Date(n.created_at).toLocaleString()}</p></button>))}</div>);
}
