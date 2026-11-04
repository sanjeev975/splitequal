import { describe, it, expect } from "vitest";
import { safeNext } from "../src/lib/safeNext";
describe("safeNext", () => {
  it("keeps same-site paths (invite links, query strings)", () => { expect(safeNext("/join/abc123")).toBe("/join/abc123"); expect(safeNext("/groups?x=1")).toBe("/groups?x=1"); expect(safeNext("/loginx")).toBe("/loginx"); });
  it("rejects anything that could leave the site", () => { for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", "/a\r\nb"]) expect(safeNext(bad)).toBe("/dashboard"); });
  it("falls back for empty values and for login/forgot (loop guard)", () => { expect(safeNext(null)).toBe("/dashboard"); expect(safeNext("")).toBe("/dashboard"); expect(safeNext("/login")).toBe("/dashboard"); expect(safeNext("/login?next=/x")).toBe("/dashboard"); expect(safeNext("/forgot")).toBe("/dashboard"); });
});
