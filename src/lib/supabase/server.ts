import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const c = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => c.getAll(),
        setAll: (
          list: { name: string; value: string; options: CookieOptions }[]
        ) => {
          try {
            list.forEach(({ name, value, options }) =>
              c.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; safe to ignore if middleware refreshes sessions.
          }
        },
      },
    }
  );
}