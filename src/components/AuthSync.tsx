"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Syncs auth state across tabs by listening for changes in Supabase localStorage.
 */
export function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    const sb = supabaseBrowser();

    // Listen for auth state changes (e.g., signIn, signOut in another tab)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    // Listen for storage events (when other tabs change localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("sb-")) {
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  return null;
}
