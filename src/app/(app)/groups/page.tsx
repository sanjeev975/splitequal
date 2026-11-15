import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CreateGroup } from "@/components/CreateGroup";
import { netPositions } from "@/lib/money/balances";
import { fmt } from "@/lib/format";

export default async function Groups() {
  const sb = await supabaseServer();
  const [{ data: { user } }, { data: groups }, { data: archived }, { data: ex }, { data: st }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("groups").select("id,name,type,base_currency").is("archived_at", null).order("created_at", { ascending: false }),
    sb.from("groups").select("id,name").not("archived_at", "is", null),
    sb.from("expenses").select("id,group_id,amount_minor,currency,expense_payments(user_id,amount_minor),expense_splits(user_id,amount_minor)"),
    sb.from("settlements").select("id,group_id,from_user,to_user,amount_minor,currency,status"),
  ]);

  const groupBalances: Record<string, number> = {};
  if (user && groups) {
    for (const g of groups) {
      const net = netPositions(
        (ex ?? []).filter((e: any) => e.group_id === g.id && e.currency === g.base_currency).map((e: any) => ({
          payments: e.expense_payments.map((p: any) => ({ userId: p.user_id, amount: Number(p.amount_minor) })),
          splits: e.expense_splits.map((p: any) => ({ userId: p.user_id, amount: Number(p.amount_minor) }))
        })),
        (st ?? []).filter((s: any) => s.group_id === g.id && s.currency === g.base_currency).map((s: any) => ({
          from: s.from_user, to: s.to_user, amount: Number(s.amount_minor), status: s.status
        }))
      );
      groupBalances[g.id] = net[user.id] ?? 0;
    }
  }

  return (
    <div className="space-y-4 page-bottom-space">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Your groups</h1>
      </div>
      <CreateGroup />
      {!groups?.length ? (
        <p className="card text-sm">No groups yet. Tap "+ New group" above to start splitting.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const bal = groupBalances[g.id] ?? 0;
            return (
              <li key={g.id}>
                <Link href={`/groups/${g.id}`} className="card block hover:border-primary transition space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-display text-lg font-bold">{g.name}</p>
                    <span className="chip !text-[11px]">{g.type}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted text-xs">{g.base_currency}</span>
                    {bal !== 0 ? (
                      <span className={`font-mono text-xs font-bold ${bal > 0 ? "text-good" : "text-danger"}`}>
                        {bal > 0 ? `You're owed ${fmt(bal, g.base_currency)}` : `You owe ${fmt(Math.abs(bal), g.base_currency)}`}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Settled up</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {!!archived?.length && (
        <section className="card space-y-2">
          <h2 className="h-card text-muted">Archived groups</h2>
          <div className="flex flex-wrap gap-2">
            {archived.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`} className="chip-link text-xs">
                {g.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
