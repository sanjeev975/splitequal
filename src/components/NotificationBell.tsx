"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
export function NotificationBell() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const sb = supabaseBrowser(); let cancelled = false; let ch: ReturnType<typeof sb.channel> | undefined;
    const load = async () => { const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null); if (!cancelled) setN(count ?? 0); };
    (async () => {
      const { data: { user } } = await sb.auth.getUser(); if (!user || cancelled) return;
      await load(); if (cancelled) return; // effect may have been cleaned up (React StrictMode double-run) while awaiting
      // Unique topic per effect run: re-using a topic returns the already-subscribed channel, and .on() after subscribe() throws.
      ch = sb.channel(`bell:${user.id}:${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    })();
    return () => { cancelled = true; if (ch) sb.removeChannel(ch); };
  }, []);
  return (<Link href="/notifications" className="relative" aria-label={`Notifications, ${n} unread`}><Bell size={20} />
    {n > 0 && <span className="absolute -top-2 -right-3 rounded-full bg-coral text-on text-xs px-1.5">{n > 9 ? "9+" : n}</span>}</Link>);
}
