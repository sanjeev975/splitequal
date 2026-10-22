import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";
// Opening a notification goes through here. Signed out -> middleware sends you to login and brings you back to this URL.
// Signed in but the group is gone / you left -> a clear message on the notifications page (never the login page).
export default async function OpenNotification({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/notifications?msg=missing");
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/n/${id}`)}`);
  const { data: n } = await sb.from("notifications").select("id,group_id,link,read_at").eq("id", id).maybeSingle(); // row-level security: only your own
  if (!n) redirect("/notifications?msg=missing"); // someone else's or already deleted: don't reveal which
  if (!n.read_at) await sb.rpc("mark_notifications_read", { p_ids: [n.id] });
  if (n.group_id) { const { data: g } = await sb.from("groups").select("id").eq("id", n.group_id).maybeSingle(); if (!g) redirect("/notifications?msg=no-access"); }
  redirect(safeNext(n.link, "/notifications")); // no link (e.g. someone who left) -> just back to the list, now marked read
}
