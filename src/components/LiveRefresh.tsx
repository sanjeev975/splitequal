"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
// Realtime events are RLS-scoped to groups the user belongs to. No column filter, because DELETE events can't be filtered. Refresh is debounced.
export function LiveRefresh({ groupId }: { groupId: string }) {
  const r = useRouter();
  useEffect(() => {
    const sb = supabaseBrowser(); let t: ReturnType<typeof setTimeout>;
    const bump = () => { clearTimeout(t); t = setTimeout(() => r.refresh(), 300); };
    const ch = sb.channel(`group:${groupId}:${crypto.randomUUID()}`); // unique topic per run (see NotificationBell)
    for (const table of ["expenses", "settlements", "group_members"]) ch.on("postgres_changes", { event: "*", schema: "public", table }, bump);
    ch.subscribe();
    return () => { clearTimeout(t); sb.removeChannel(ch); };
  }, [groupId, r]);
  return null;
}
