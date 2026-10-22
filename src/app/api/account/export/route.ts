import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
const dec = (n: number | string) => `${Math.floor(Number(n) / 100)}.${String(Number(n) % 100).padStart(2, "0")}`;
export async function GET(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); // another website can't trigger a download of your data
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  // Everything below goes through the user's own session, so row-level security limits it to what they're allowed to see.
  const [profile, handles, memberships, expenses, settlements, notifications, people] = await Promise.all([
    sb.from("profiles").select("display_name,username,default_currency,time_zone,created_at").eq("id", user.id).single(),
    sb.from("payment_handles").select("upi_id,venmo_handle").eq("user_id", user.id).maybeSingle(),
    sb.from("group_members").select("role,joined_at,groups(name,type,base_currency)").eq("user_id", user.id),
    sb.from("expenses").select("title,amount_minor,currency,expense_date,category,notes,created_by,created_at,groups(name),expense_payments(user_id,amount_minor),expense_splits(user_id,amount_minor)").order("expense_date", { ascending: false }),
    sb.from("settlements").select("amount_minor,currency,status,note,resolution_note,created_at,from_user,to_user,groups(name)").or(`from_user.eq.${user.id},to_user.eq.${user.id}`).order("created_at", { ascending: false }),
    sb.from("notifications").select("type,title,body,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("profiles").select("id,display_name"),
  ]);
  const nm = (id: string) => (id === user.id ? "You" : (people.data ?? []).find((p) => p.id === id)?.display_name ?? "Former member");
  const lines = (l: any[]) => (l ?? []).map((x) => ({ person: nm(x.user_id), amount: dec(x.amount_minor) }));
  const mine = (expenses.data ?? []).filter((e: any) => e.created_by === user.id || e.expense_payments.some((p: any) => p.user_id === user.id) || e.expense_splits.some((s: any) => s.user_id === user.id));
  const out = { generated_at: new Date().toISOString(), note: "Amounts are decimal strings in the stated currency. Other people appear by display name only.",
    account: { email: user.email, ...profile.data, payment_handles: handles.data ?? null },
    groups: (memberships.data ?? []).map((m: any) => ({ name: m.groups?.name, type: m.groups?.type, currency: m.groups?.base_currency, your_role: m.role, joined_at: m.joined_at })),
    expenses_you_took_part_in: mine.map((e: any) => ({ group: e.groups?.name, title: e.title, date: e.expense_date, category: e.category, notes: e.notes, total: dec(e.amount_minor), currency: e.currency, added_by: nm(e.created_by), paid: lines(e.expense_payments), shares: lines(e.expense_splits) })),
    settlements: (settlements.data ?? []).map((s: any) => ({ group: s.groups?.name, from: nm(s.from_user), to: nm(s.to_user), amount: dec(s.amount_minor), currency: s.currency, status: s.status, note: s.note, reason: s.resolution_note, date: s.created_at })),
    notifications: notifications.data ?? [] };
  return new NextResponse(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="splitequal-data-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}
