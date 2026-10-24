import { describe, it, expect } from "vitest";
import { defaultSelection, PERSONAL } from "../src/lib/quickAdd";
const shared = [{ id: "g1", type: "Travel" }, { id: "g2", type: "Household" }]; const withPersonal = [...shared, { id: "p1", type: "Personal" }];
describe("defaultSelection", () => {
  it("starts on Personal when there are no groups", () => { expect(defaultSelection({ groups: [] })).toBe(PERSONAL); });
  it("starts on the first shared group otherwise", () => { expect(defaultSelection({ groups: withPersonal })).toBe("g1"); });
  it("prefers an explicit choice, then the last one used", () => { expect(defaultSelection({ initial: "g2", last: "g1", groups: shared })).toBe("g2"); expect(defaultSelection({ last: "g2", groups: shared })).toBe("g2"); });
  it("treats the personal group's id (or the Personal marker) as Personal", () => { expect(defaultSelection({ initial: "p1", groups: withPersonal })).toBe(PERSONAL); expect(defaultSelection({ last: PERSONAL, groups: shared })).toBe(PERSONAL); });
  it("ignores choices you no longer have", () => { expect(defaultSelection({ initial: "gone", last: "alsogone", groups: shared })).toBe("g1"); });
});
