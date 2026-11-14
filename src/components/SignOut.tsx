"use client";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SignOut() {
  return (
    <button
      className="btn"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
