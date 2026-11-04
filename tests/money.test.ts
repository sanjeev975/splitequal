import { describe, it, expect } from "vitest";
import { allocate, splitExpense, toMinor, totalWithAdjustments, validatePayments } from "../src/lib/money/split";
import { netPositions, simplify } from "../src/lib/money/balances";

describe("split", () => {
  it("parses without floats", () => { expect(toMinor("0.10")).toBe(10); expect(() => toMinor("1.005")).toThrow(); });
  it("equal split distributes residual deterministically", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(1, [1, 1, 1])).toEqual([1, 0, 0]);
  });
  it("weighted shares sum to total", () => {
    for (const t of [1, 99, 1001, 123457]) expect(allocate(t, [3, 5, 7, 0]).reduce((a, b) => a + b)).toBe(t);
    expect(allocate(100, [3, 5, 7, 0])[3]).toBe(0);
  });
  it("percent must total 100", () => {
    expect(() => splitExpense(100, "percent", [{ id: "a", value: 5000 }, { id: "b", value: 4000 }])).toThrow();
    expect(splitExpense(100, "percent", [{ id: "a", value: 3333 }, { id: "b", value: 6667 }])).toEqual({ a: 33, b: 67 });
  });
  it("exact rejects mismatch and negatives", () => {
    expect(() => splitExpense(100, "exact", [{ id: "a", value: 60 }, { id: "b", value: 30 }])).toThrow();
    expect(() => splitExpense(100, "exact", [{ id: "a", value: 120 }, { id: "b", value: -20 }])).toThrow();
  });
  it("adjustments and payer validation", () => {
    expect(totalWithAdjustments(1000, { tax: 180, tip: 100, discount: 50 })).toBe(1230);
    expect(() => validatePayments(100, [{ userId: "a", amount: 60 }])).toThrow();
  });
});

describe("balances", () => {
  const e = { payments: [{ userId: "a", amount: 300 }], splits: [{ userId: "a", amount: 100 }, { userId: "b", amount: 100 }, { userId: "c", amount: 100 }] };
  it("nets; payer need not participate", () => {
    expect(netPositions([e])).toEqual({ a: 200, b: -100, c: -100 });
    expect(netPositions([{ payments: [{ userId: "x", amount: 50 }], splits: [{ userId: "y", amount: 50 }] }])).toEqual({ x: 50, y: -50 });
  });
  it("only confirmed settlements count", () => {
    const pend = { from: "b", to: "a", amount: 100, status: "pending" as const };
    expect(netPositions([e], [pend]).b).toBe(-100);
    expect(netPositions([e], [{ ...pend, status: "confirmed" }]).b).toBe(0);
  });
  it("simplify", () => {
    expect(simplify({ a: 200, b: -100, c: -100 })).toEqual([{ from: "b", to: "a", amount: 100 }, { from: "c", to: "a", amount: 100 }]);
  });
});
