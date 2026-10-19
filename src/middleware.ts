import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
type CookieToSet = { name: string; value: string; options?: any }; // explicit: see src/lib/supabase/server.ts
export async function middleware(req: NextRequest) {
  const needsAuth = ["/groups", "/dashboard", "/profile", "/notifications", "/analytics"].some((p) => req.nextUrl.pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next(); // landing, login, join, etc.: no auth call at all
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l: CookieToSet[]) => {
      l.forEach(({ name, value }) => req.cookies.set(name, value));
      res = NextResponse.next({ request: req });
      l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  return res;
}
export const config = { matcher: ["/((?!_next|favicon.ico|sw.js|manifest.json|offline.html|icons/|screenshots/).*)"] };
