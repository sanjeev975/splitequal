import { describe, it, expect } from "vitest";
import { byCategory, byMember, byMonth, topN, totals, type Ex } from "../src/lib/analytics";
const ex = (cat: string, date: string, amt: number, payer: string, splits: Record<string, number>): Ex => ({ group_id: "g", currency: "INR", expense_date: date, category: cat, amount_minor: amt,
  expense_payments: [{ user_id: payer, amount_minor: amt }], expense_splits: Object.entries(splits).map(([user_id, a]) => ({ user_id, amount_minor: a })) });
const data = [ex("Restaurants", "2026-09-10", 3000, "a", { a: 1000, b: 1000, c: 1000 }), ex("Fuel", "2026-10-02", 1000, "b", { a: 500, b: 500 }), ex("Restaurants", "2026-10-05", 600, "a", { b: 600 })];
describe("analytics", () => {
  it("separates total spend from my share", () => {
    expect(byCategory(data, "total", "a")).toEqual([{ name: "Restaurants", value: 3600 }, { name: "Fuel", value: 1000 }]);
    expect(byCategory(data, "mine", "a")).toEqual([{ name: "Restaurants", value: 1000 }, { name: "Fuel", value: 500 }]);
  });
  it("paid vs owed per member (payer need not be a participant)", () => { const m = byMember(data); expect(m.a).toEqual({ paid: 3600, owed: 1500 }); expect(m.b).toEqual({ paid: 1000, owed: 2100 }); });
  it("groups by month and totals", () => { expect(byMonth(data, "a")).toEqual([{ month: "2026-09", total: 3000, mine: 1000 }, { month: "2026-10", total: 1600, mine: 500 }]); expect(totals(data, "a")).toEqual({ spent: 4600, share: 1500, paid: 3600, count: 3 }); });
  it("folds small categories into Other", () => { const many = Array.from({ length: 10 }, (_, i) => ({ name: `c${i}`, value: 10 - i })); const t = topN(many, 7); expect(t).toHaveLength(8); expect(t[7]).toEqual({ name: "Other categories", value: 3 + 2 + 1 }); });
});
