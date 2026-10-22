import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { aliasFor, hasAuthCookie, kindOf, redirectFor } from "@/lib/routing";
type CookieToSet = { name: string; value: string; options?: any }; // explicit: see src/lib/supabase/server.ts
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const alias = aliasFor(path); if (alias) return NextResponse.redirect(new URL(alias, req.url)); // /signup -> /login?mode=up (signed-in users are then bounced to the dashboard)
  const kind = kindOf(path); if (kind === "public") return NextResponse.next(); // landing, join, guest, legal pages...: no auth call at all
  if (!hasAuthCookie(req.cookies.getAll().map((c) => c.name))) { // no session cookie: certainly signed out, skip the Supabase round-trip (keeps the landing page fast for new visitors)
    const to = redirectFor(kind, path, req.nextUrl.search, false); return to ? NextResponse.redirect(new URL(to, req.url)) : NextResponse.next();
  }
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l: CookieToSet[]) => {
      l.forEach(({ name, value }) => req.cookies.set(name, value));
      res = NextResponse.next({ request: req });
      l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); } } });
  const { data: { user } } = await sb.auth.getUser();
  const to = redirectFor(kind, path, req.nextUrl.search, !!user);
  if (to) { const redirect = NextResponse.redirect(new URL(to, req.url)); res.cookies.getAll().forEach((c) => redirect.cookies.set(c)); return redirect; } // keep any refreshed session cookies
  return res;
}
export const config = { matcher: ["/((?!_next|favicon.ico|sw.js|manifest.json|offline.html|icons/|screenshots/).*)"] };
