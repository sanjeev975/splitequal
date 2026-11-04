import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// The parameter type is written out on purpose: @supabase/ssr's overloads stop TypeScript from inferring it, which fails `next build` (but not `next dev`).
type CookieToSet = { name: string; value: string; options?: any };
export async function supabaseServer() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => c.getAll(), setAll: (l: CookieToSet[]) => { try { l.forEach(({ name, value, options }) => c.set(name, value, options)); } catch {} } } });
}
