import { describe, it, expect } from "vitest";
import { LEGAL, hasPlaceholders } from "../src/lib/legal";
describe("legal pages", () => {
  it("has every required field", () => { for (const k of ["operator", "email", "updated"]) expect((LEGAL as Record<string, string>)[k]).toBeTruthy(); });
  // Before launch run:  LEGAL_STRICT=1 npm test   -> fails until every [placeholder] in src/lib/legal.ts is replaced
  it.skipIf(!process.env.LEGAL_STRICT)("has no [placeholders] left", () => { expect(hasPlaceholders()).toBe(false); });
});
