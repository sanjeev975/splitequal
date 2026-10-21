import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safeNext";
type CookieToSet = { name: string; value: string; options?: any }; // explicit: see src/lib/supabase/server.ts
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const needsAuth = ["/groups", "/dashboard", "/profile", "/notifications", "/analytics", "/add"].some((p) => path.startsWith(p));
  const guestOnly = path === "/login" || path === "/forgot"; // pointless once you're signed in
  if (!needsAuth && !guestOnly) return NextResponse.next(); // landing, join, guest, legal pages...: no auth call at all
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l: CookieToSet[]) => {
      l.forEach(({ name, value }) => req.cookies.set(name, value));
      res = NextResponse.next({ request: req });
      l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); } } });
  const { data: { user } } = await sb.auth.getUser();
  if (needsAuth && !user) return NextResponse.redirect(new URL("/login", req.url));
  if (guestOnly && user) { // already signed in: go where they were headed (e.g. an invite link) or the dashboard
    const redirect = NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")), req.url));
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep any refreshed session cookies
    return redirect;
  }
  return res;
}
export const config = { matcher: ["/((?!_next|favicon.ico|sw.js|manifest.json|offline.html|icons/|screenshots/).*)"] };
