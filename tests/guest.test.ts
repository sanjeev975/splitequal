import { describe, it, expect } from "vitest";
import { toPayload, type LocalGroup } from "../src/lib/guestMigration";
describe("guest migration payload", () => {
  it("maps a local group to the import_guest_group payload", () => {
    const g: LocalGroup = { id: "l1", name: "Goa", currency: "INR", me: "m1", members: [{ id: "m1", name: "Asha" }, { id: "m2", name: "Ravi" }],
      expenses: [{ title: "Dinner", amountMinor: 3000, paidBy: [{ member: "m1", amount: 3000 }], splits: [{ member: "m1", amount: 1500 }, { member: "m2", amount: 1500 }] }] };
    const p = toPayload(g); expect(p.me).toBe("m1"); expect(p.members).toHaveLength(2); expect(p.expenses[0].amount_minor).toBe(3000); expect(p.expenses[0].paid_by[0]).toEqual({ member: "m1", amount: 3000 });
  });
});
describe("guest settlements", () => {
  it("carries settlements into the import payload", () => {
    const p = toPayload({ id: "l", name: "G", currency: "INR", me: "a", members: [{ id: "a", name: "A" }, { id: "b", name: "B" }], settlements: [{ id: "s1", from: "b", to: "a", amountMinor: 500 }] });
    expect(p.settlements).toEqual([{ from: "b", to: "a", amount_minor: 500 }]);
  });
});
