import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/groups", "/dashboard", "/profile", "/notifications", "/analytics"];

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  const needsAuth = PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next(); // landing, login, join, etc.: no auth call at all

  let res = NextResponse.next({ request: req });

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: CookieToSet[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|sw.js|manifest.json|offline.html|icons/|screenshots/).*)"],
};