import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CreateGroup } from "@/components/CreateGroup";
export default async function Groups() {
  const sb = await supabaseServer();
  const { data: groups } = await sb.from("groups").select("id,name,type,base_currency").is("archived_at", null).order("created_at", { ascending: false });
  const { data: archived } = await sb.from("groups").select("id,name").not("archived_at", "is", null);
  return (<div className="space-y-5"><h1 className="font-display text-3xl font-bold">Your groups</h1><CreateGroup />
    {!groups?.length ? <p className="card">No groups yet. Create one above to start splitting.</p> :
      <ul className="grid gap-3 sm:grid-cols-2">{groups.map((g) => (<li key={g.id}><Link href={`/groups/${g.id}`} className="card block hover:-translate-y-0.5 transition">
        <p className="font-display text-xl font-bold">{g.name}</p><p className="text-sm opacity-70">{g.type} · {g.base_currency}</p></Link></li>))}</ul>}
    {!!archived?.length && <section className="card"><h2 className="font-semibold">Archived</h2>{archived.map((g) => <Link key={g.id} href={`/groups/${g.id}`} className="underline mr-3">{g.name}</Link>)}</section>}
  </div>);
}
