import { describe, it, expect } from "vitest";
import { aliasFor, hasAuthCookie, kindOf, redirectFor } from "../src/lib/routing";
const go = (path: string, signedIn: boolean, search = "") => redirectFor(kindOf(path), path, search, signedIn);
describe("/home", () => {
  it("sends signed-in users to the dashboard and signed-out users to login", () => { expect(go("/home", true)).toBe("/dashboard"); expect(go("/home", false)).toBe("/login"); });
});
describe("protected pages", () => {
  it("send signed-out users to login WITH the destination", () => { expect(go("/groups/abc", false)).toBe("/login?next=%2Fgroups%2Fabc"); expect(go("/n/123", false)).toBe("/login?next=%2Fn%2F123"); expect(go("/groups", false, "?x=1")).toBe("/login?next=%2Fgroups%3Fx%3D1"); });
  it("let signed-in users through", () => { for (const p of ["/dashboard", "/groups/abc", "/notifications", "/n/123", "/add"]) expect(go(p, true)).toBeNull(); });
  it("are matched by whole path segment, not by prefix", () => { expect(kindOf("/notifications")).toBe("protected"); expect(kindOf("/nothing")).toBe("public"); expect(kindOf("/addons")).toBe("public"); expect(kindOf("/groupsx")).toBe("public"); });
});
describe("login and forgot", () => {
  it("bounce signed-in users to where they were headed, else the dashboard", () => { expect(go("/login", true, "?next=/n/123")).toBe("/n/123"); expect(go("/login", true)).toBe("/dashboard"); expect(go("/forgot", true)).toBe("/dashboard"); });
  it("never redirect to somewhere off-site", () => { expect(go("/login", true, "?next=//evil.com")).toBe("/dashboard"); expect(go("/login", true, "?next=https://evil.com")).toBe("/dashboard"); });
  it("leave signed-out users alone", () => { expect(go("/login", false)).toBeNull(); });
});
describe("public pages and aliases", () => {
  it("never trigger an auth check", () => { for (const p of ["/privacy", "/terms", "/guest", "/guest/x", "/join/abc", "/reset", "/auth/callback"]) expect(kindOf(p)).toBe("public"); }); // "/" is deliberately not here: it is the "landing" kind (signed-in visitors are sent to the dashboard)
  it("sign-up aliases open the sign-up form", () => { expect(aliasFor("/signup")).toBe("/login?mode=up"); expect(aliasFor("/signin")).toBe("/login"); expect(aliasFor("/dashboard")).toBeNull(); });
});
describe("landing page (/)", () => {
  it("sends signed-in visitors to the dashboard, and shows the landing page to everyone else", () => { expect(go("/", true)).toBe("/dashboard"); expect(go("/", false)).toBeNull(); });
  it("does the same for the legal pages' Home link, which points at /", () => { expect(kindOf("/")).toBe("landing"); expect(kindOf("/privacy")).toBe("public"); });
});
describe("session cookie pre-check", () => {
  it("recognises Supabase session cookies, including chunked ones", () => { expect(hasAuthCookie(["sb-abcd-auth-token"])).toBe(true); expect(hasAuthCookie(["sb-abcd-auth-token.0", "sb-abcd-auth-token.1"])).toBe(true); });
  it("ignores everything else (including the sign-in code verifier)", () => { expect(hasAuthCookie([])).toBe(false); expect(hasAuthCookie(["sb-abcd-auth-token-code-verifier"])).toBe(false); expect(hasAuthCookie(["theme", "_ga"])).toBe(false); });
});
