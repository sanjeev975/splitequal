"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";
export function NavAvatar() {
  const [p, setP] = useState<{ avatar_path: string | null; display_name: string } | null>(null);
  const load = useCallback(async () => { const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser(); if (!user) return;
    const { data } = await sb.from("profiles").select("avatar_path,display_name").eq("id", user.id).single(); if (data) setP(data); }, []);
  useEffect(() => { load(); window.addEventListener("avatar-changed", load); return () => window.removeEventListener("avatar-changed", load); }, [load]);
  return p ? <Link href="/profile" aria-label="Your profile"><Avatar path={p.avatar_path} name={p.display_name} size={32} /></Link> : null;
}
