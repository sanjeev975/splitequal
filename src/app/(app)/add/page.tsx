import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { membersByGroup } from "@/lib/members";
import { PERSONAL } from "@/lib/quickAdd";
import { QuickAdd } from "@/components/QuickAdd";
export const metadata = { title: "Add expense · Splitequal" };
export default async function AddExpensePage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams; const sb = await supabaseServer();
  const [{ data: { user } }, { data: groups }, { data: mem }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("groups").select("id,name,type,base_currency").is("archived_at", null).order("created_at", { ascending: false }),
    sb.from("group_members").select("group_id,user_id,profiles(display_name,username)"), // members of every group you're in (row-level security)
  ]);
  if (!user) redirect("/login?next=%2Fadd");
  const list = (groups ?? []) as any[]; const asked = list.find((x) => x.id === g);
  return (<div className="space-y-3"><h1 className="font-display text-2xl font-bold">Add expense</h1>
    <QuickAdd groups={list} membersByGroup={membersByGroup(mem ?? [])} me={user.id} initial={asked ? (asked.type === "Personal" ? PERSONAL : asked.id) : ""} /></div>);
}
