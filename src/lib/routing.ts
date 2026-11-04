import { isActive } from "./nav";
import { safeNext } from "./safeNext";
// ALL routing decisions for the middleware live here as pure functions, so they can be unit-tested.
const PROTECTED = ["/groups", "/dashboard", "/profile", "/notifications", "/analytics", "/add", "/n"]; // segment-aware: "/n" matches /n/abc, not /notifications or /nothing
const ALIASES: Record<string, string> = { "/signup": "/login?mode=up", "/sign-up": "/login?mode=up", "/register": "/login?mode=up", "/signin": "/login", "/sign-in": "/login" };
export type RouteKind = "public" | "protected" | "guestOnly" | "home" | "landing";
export const aliasFor = (path: string) => ALIASES[path] ?? null;
export function kindOf(path: string): RouteKind {
  if (path === "/") return "landing"; // the marketing page: only for people who are NOT signed in
  if (path === "/home") return "home";
  if (path === "/login" || path === "/forgot") return "guestOnly";
  return PROTECTED.some((p) => isActive(path, p)) ? "protected" : "public";
}
/** Where to send this visitor, or null to let the request through. Being denied a *resource* is never a reason to land here: only being signed out is. */
export function redirectFor(kind: RouteKind, path: string, search: string, signedIn: boolean): string | null {
  if (kind === "landing") return signedIn ? "/dashboard" : null;
  if (kind === "home") return signedIn ? "/dashboard" : "/login";
  if (kind === "protected" && !signedIn) return `/login?next=${encodeURIComponent(path + search)}`; // remember the destination
  if (kind === "guestOnly" && signedIn) return safeNext(new URLSearchParams(search).get("next"));
  return null;
}
/** Cheap pre-check: does this request carry a Supabase session cookie at all? No cookie = definitely signed out, so no network call is needed. (A cookie still has to be verified with Supabase.) */
export const hasAuthCookie = (names: string[]) => names.some((n) => /^sb-.+-auth-token(\.\d+)?$/.test(n));
