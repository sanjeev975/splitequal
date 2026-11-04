"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
export function SignOut() {
  const r = useRouter();
  return <button className="btn" onClick={async () => { await supabaseBrowser().auth.signOut(); r.push("/"); r.refresh(); }}>Sign out</button>;
}
