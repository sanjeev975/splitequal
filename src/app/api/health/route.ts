import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
// For uptime monitors. Proves the app server AND the database are reachable; reveals no details on failure.
export async function GET() {
  const t = Date.now(); const headers = { "Cache-Control": "no-store" };
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    const { error } = await sb.rpc("username_available", { p_username: "healthcheck" }).abortSignal(AbortSignal.timeout(3000));
    if (error) throw error;
    return NextResponse.json({ status: "ok", db: "up", ms: Date.now() - t }, { headers });
  } catch { return NextResponse.json({ status: "degraded", db: "down" }, { status: 503, headers }); }
}
