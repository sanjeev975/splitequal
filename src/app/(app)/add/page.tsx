import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { membersByGroup } from "@/lib/members";
import { QuickAdd } from "@/components/QuickAdd";
export const metadata = { title: "Add expense · Splitequal" };
export default async function AddExpensePage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams; const sb = await supabaseServer();
  const [{ data: { user } }, { data: groups }, { data: mem }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("groups").select("id,name,base_currency").is("archived_at", null).order("created_at", { ascending: false }),
    sb.from("group_members").select("group_id,user_id,profiles(display_name,username)"), // members of every group you're in (row-level security)
  ]);
  if (!user) redirect("/login?next=%2Fadd");
  return (<div className="space-y-3"><h1 className="font-display text-2xl font-bold">Add expense</h1>
    {!groups?.length ? <div className="card space-y-2 text-sm"><p>Create a group first, then you can add expenses to it.</p><Link className="btn" href="/groups">Create a group</Link></div>
      : <QuickAdd groups={groups as any} membersByGroup={membersByGroup(mem ?? [])} me={user.id} initial={groups.some((x: any) => x.id === g) ? (g as string) : groups[0].id} />}</div>);
}
