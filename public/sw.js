// Splitequal service worker. Deliberately minimal and privacy-safe:
// - Only immutable static assets (/_next/static, /icons) are cached. Pages, API and Supabase calls are NEVER cached,
//   so no financial data is stored offline and nothing stale or private survives sign-out.
// - Navigations are network-first with a branded offline fallback.
// Bump V to force old caches to be deleted on the next deploy.
const V = "splitequal-v2"; // bumped: changing this deletes every older cache on activation (clears the stale-code problem)
// Only cache files whose NAME contains a content hash (production builds). Dev files like page.js keep the same name while their content changes, so caching them served stale code.
const HASHED = /[-./][0-9a-f]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp)$/i;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return; // never touch Supabase or other origins
  if (req.mode === "navigate") { e.respondWith(fetch(req).catch(() => caches.match("/offline.html"))); return; }
  if ((url.pathname.startsWith("/_next/static/") && !url.pathname.includes("/development/") && HASHED.test(url.pathname)) || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(V).then((c) => c.put(req, copy)); } return res; })));
  }
});
