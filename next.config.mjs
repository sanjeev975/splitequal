// Security headers. CSP is locked to this site + your Supabase project. Set CSP_REPORT_ONLY=1 to log violations instead of blocking while you test.
const dev = process.env.NODE_ENV !== "production";
const sentry = process.env.SENTRY_INGEST_HOST ? ` https://${process.env.SENTRY_INGEST_HOST}` : ""; // optional error-tracker endpoint
const supa = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "*.supabase.co";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`, // Next.js emits inline bootstrap scripts; a nonce-based strict CSP is a later hardening step
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supa}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${supa} wss://${supa}${sentry}${dev ? " ws://localhost:* http://localhost:*" : ""}`,
  "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");
const secure = [
  { key: process.env.CSP_REPORT_ONLY === "1" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];
export default {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: secure },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/manifest.json", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] },
    ];
  },
};
