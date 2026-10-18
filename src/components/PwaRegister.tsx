"use client";
import { useEffect } from "react";
// Production only: avoids stale-asset confusion while developing. Test installs with `npm run build && npm start`.
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") { navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {}); return; }
    // Development: remove any worker/caches left over from an earlier production test so you always see fresh code.
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())); caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  }, []);
  return null;
}
