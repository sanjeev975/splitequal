"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Notifications() {
  const r = useRouter(); const sb = supabaseBrowser(); const [items, setItems] = useState<any[] | null>(null); const [unreadOnly, setUnreadOnly] = useState(false);
  const [reachable, setReachable] = useState<Set<string> | null>(null); const [banner, setBanner] = useState("");
  const load = useCallback(async () => {
    const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50); const list = data ?? []; setItems(list);
    const ids = [...new Set(list.map((n: any) => n.group_id).filter(Boolean))] as string[];
    if (!ids.length) return setReachable(new Set());
    const { data: gs } = await sb.from("groups").select("id").in("id", ids); // only groups you can still open come back
    setReachable(new Set((gs ?? []).map((g: any) => g.id as string)));
  }, [sb]);
  useEffect(() => { // message handed over by /n/<id> when a destination could not be opened
    const m = new URLSearchParams(location.search).get("msg");
    if (m === "no-access") setBanner("You no longer have access to that group. You may have left it, been removed, or it may have been deleted.");
    else if (m === "missing") setBanner("That notification is no longer available.");
    if (m) history.replaceState(null, "", "/notifications");
  }, []);
  useEffect(() => { let cancelled = false; let ch: ReturnType<typeof sb.channel> | undefined; load();
    sb.auth.getUser().then(({ data: { user } }) => { if (!user || cancelled) return;
      ch = sb.channel(`notif-page:${user.id}:${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe(); });
    return () => { cancelled = true; if (ch) sb.removeChannel(ch); }; }, [sb, load]);
  const gone = (n: any) => !!n.group_id && reachable !== null && !reachable.has(n.group_id);
  const shown = (items ?? []).filter((n) => !unreadOnly || !n.read_at);
  async function open(n: any) {
    if (gone(n)) { if (!n.read_at) { await sb.rpc("mark_notifications_read", { p_ids: [n.id] }); load(); } return; } // nothing to open: just mark it read
    r.push(`/n/${n.id}`); // the resolver checks access and explains if something is unavailable
  }
  return (<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="font-display text-3xl font-bold">Notifications</h1>
    <div className="flex items-center gap-3"><label className="flex gap-1 text-sm"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Unread only</label>
      <button className="btn btn-sm" onClick={async () => { await sb.rpc("mark_notifications_read", { p_ids: null }); load(); }}>Mark all read</button></div></div>
    {banner && <p role="status" className="inset flex items-start justify-between gap-3 text-sm"><span>{banner}</span><button className="underline" onClick={() => setBanner("")}>Dismiss</button></p>}
    {items === null ? <p>Loading…</p> : !shown.length ? <p className="card">{unreadOnly ? "No unread notifications." : "Nothing yet. Activity in your groups will show up here."}</p> :
      shown.map((n) => (<button key={n.id} onClick={() => open(n)} className={`card block w-full text-left ${n.read_at ? "opacity-70" : "border-l-4 border-l-accent"} ${gone(n) ? "cursor-default" : ""}`}>
        <p className={n.read_at ? "" : "font-bold"}>{n.title}</p><p className="text-sm">{n.body}</p>
        {gone(n) && <p className="mt-1 text-xs text-muted">You no longer have access to this group.</p>}
        <p className="text-xs text-muted">{new Date(n.created_at).toLocaleString()}</p></button>))}</div>);
}
