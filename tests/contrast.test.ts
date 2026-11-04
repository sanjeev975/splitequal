import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PAIRS, ratio, themes } from "./helpers/contrast";
const { light, dark, mediaDark } = themes(readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8"));
describe("design tokens: WCAG contrast", () => {
  for (const [name, t] of [["light", light], ["dark", dark]] as const)
    for (const [fg, bg, min] of PAIRS) it(`${name}: ${fg} on ${bg} >= ${min}`, () => expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min));
  it("automatic dark mode (system setting) uses exactly the same colors as the manual dark theme", () => expect(mediaDark).toEqual(dark));
});
