import { describe, it, expect } from "vitest";
import { isActive } from "../src/lib/nav";
describe("isActive", () => {
  it("matches the page itself and pages below it", () => { expect(isActive("/groups", "/groups")).toBe(true); expect(isActive("/groups/abc", "/groups")).toBe(true); });
  it("does not match look-alikes or other tabs", () => { expect(isActive("/groupsx", "/groups")).toBe(false); expect(isActive("/dashboard", "/groups")).toBe(false); expect(isActive("/", "/groups")).toBe(false); });
});
