import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";
// Email links (password reset, signup confirmation) land here with ?code=... We exchange it for a session on the SERVER (sets the login cookies),
// then send the person on to `next`. Without this step the code is never used and the person just ends up logged out on the home/login page.
export async function GET(req: Request) {
  const url = new URL(req.url); const code = url.searchParams.get("code"); const next = safeNext(url.searchParams.get("next")); // only paths on this site (no open redirect)
  if (code) {
    const sb = await supabaseServer(); const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
