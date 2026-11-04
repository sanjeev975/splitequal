"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { migrateGuestGroups } from "@/lib/guestMigration";
export function GuestMigrationRunner() {
  const [msg, setMsg] = useState("");
  useEffect(() => { (async () => { const r = await migrateGuestGroups(supabaseBrowser());
    if (r.imported) setMsg(`Imported ${r.imported} group${r.imported > 1 ? "s" : ""} from guest mode. People without accounts appear as “Guest” members.`); else if (r.failed) setMsg("We couldn't import your guest groups yet. They're still saved on this device."); })(); }, []);
  return msg ? <p role="status" className="card mb-4 text-sm">{msg} <button className="underline" onClick={() => setMsg("")}>Dismiss</button></p> : null;
}
