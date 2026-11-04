import { describe, it, expect } from "vitest";
import { membersByGroup } from "../src/lib/members";
const row = (group_id: string, user_id: string, display_name: string, username: string) => ({ group_id, user_id, profiles: { display_name, username } });
describe("membersByGroup", () => {
  it("groups people by group", () => { const m = membersByGroup([row("g1", "a", "Asha", "asha"), row("g1", "b", "Ravi", "ravi"), row("g2", "a", "Asha", "asha")]); expect(m.g1.map((x) => x.name)).toEqual(["Asha", "Ravi"]); expect(m.g2.map((x) => x.name)).toEqual(["Asha"]); });
  it("tells same-named people apart, only inside the group where it matters", () => { const m = membersByGroup([row("g1", "a", "Sanjeev", "sanjeev_1"), row("g1", "b", "sanjeev", "sanjeev_2"), row("g2", "a", "Sanjeev", "sanjeev_1")]); expect(m.g1.map((x) => x.name)).toEqual(["Sanjeev (@sanjeev_1)", "sanjeev (@sanjeev_2)"]); expect(m.g2[0].name).toBe("Sanjeev"); });
  it("copes with no rows and missing profiles", () => { expect(membersByGroup([])).toEqual({}); expect(membersByGroup([{ group_id: "g", user_id: "x", profiles: null }]).g[0].name).toBe("Member"); });
});
