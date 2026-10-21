import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
export const metadata = { title: "Add expense · Splitequal" };
// The "Add" tab: one group -> straight to its expense form; several -> pick one; none -> create one.
export default async function AddPick() {
  const sb = await supabaseServer();
  const { data: groups } = await sb.from("groups").select("id,name,type,base_currency").is("archived_at", null).order("created_at", { ascending: false });
  if (groups?.length === 1) redirect(`/groups/${groups[0].id}#add-expense`);
  return (<div className="space-y-4"><h1 className="font-display text-3xl font-bold">Add an expense</h1>
    {!groups?.length ? <div className="card space-y-3"><p>You need a group first.</p><Link className="btn" href="/groups">Create a group</Link></div> :
      <><p className="text-muted">Which group is it for?</p>
        <ul className="grid gap-3 sm:grid-cols-2">{groups.map((g) => <li key={g.id}><Link href={`/groups/${g.id}#add-expense`} className="card block transition hover:border-primary"><p className="font-display text-xl font-bold">{g.name}</p><p className="text-sm text-muted">{g.type} · {g.base_currency}</p></Link></li>)}</ul></>}
  </div>);
}
