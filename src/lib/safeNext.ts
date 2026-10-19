/** Only same-site paths are allowed as redirect targets (blocks open redirects such as //evil.com or https://evil.com). */
export function safeNext(n: string | null | undefined, fallback = "/dashboard"): string {
  if (!n || !n.startsWith("/") || n.startsWith("//") || n.startsWith("/\\") || /[\r\n]/.test(n)) return fallback;
  if (/^\/(login|forgot)(\/|\?|#|$)/.test(n)) return fallback; // avoid redirect loops now that signed-in users are bounced off these pages
  return n;
}
