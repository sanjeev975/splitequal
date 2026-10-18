import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!; const PUB = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const err = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });
export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return err("Bad origin", 403); // CSRF guard
  if (!process.env.SUPABASE_SECRET_KEY) return err("Account deletion isn't configured on this server.", 500);
  const { password, confirm } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE" || typeof password !== "string" || !password) return err("Type DELETE and enter your password.", 400);
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return err("Not signed in.", 401);
  // Re-authenticate: a stolen/left-open session alone must not be able to delete the account.
  const { error: pwErr } = await createClient(URL_, PUB, { auth: { persistSession: false, autoRefreshToken: false } }).auth.signInWithPassword({ email: user.email, password });
  if (pwErr) return err("Incorrect password.", 403);
  const { data: blockers } = await sb.rpc("check_account_deletion");
  if (blockers?.length) return err("Resolve these first.", 409, { blockers });
  const admin = createClient(URL_, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); // service role: server only, never sent to the browser
  const { error: aErr } = await admin.rpc("anonymize_account", { p_user: user.id });
  if (aErr) return err(aErr.message.startsWith("blocked:") ? "Resolve your unsettled items first." : "Couldn't remove your data. Nothing was closed; please try again.", 409);
  const { data: files } = await admin.storage.from("avatars").list(user.id);
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
  const { error: dErr } = await admin.auth.admin.deleteUser(user.id);
  if (dErr) return err("Your personal data was removed, but closing your login failed. Please press Delete again to finish.", 500);
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
