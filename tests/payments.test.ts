import { describe, it, expect } from "vitest";
import { upiLink, venmoLink, fmtDecimal, isValidUpi, isValidVenmo, normalizeUpi } from "../src/lib/payments";
describe("payment links", () => {
  it("formats minor units without floats", () => { expect(fmtDecimal(5)).toBe("0.05"); expect(fmtDecimal(123456)).toBe("1234.56"); });
  it("builds a UPI link", () => {
    expect(upiLink({ vpa: "asha@okaxis", name: "Asha K", amountMinor: 100050, note: "Goa trip" })).toBe("upi://pay?pa=asha@okaxis&pn=Asha%20K&am=1000.50&cu=INR&tn=Goa%20trip");
  });
  it("builds a Venmo link in the documented format", () => {
    expect(venmoLink({ handle: "cassidoo", amountMinor: 1000, note: "for tix" })).toBe("https://venmo.com/cassidoo?txn=pay&amount=10.00&note=for+tix");
  });
  it("rejects handles that could inject parameters", () => {
    expect(isValidUpi("a@b&am=1")).toBe(false); expect(isValidUpi("asha@okaxis")).toBe(true);
    expect(isValidVenmo("bad handle")).toBe(false); expect(isValidVenmo("cassidoo")).toBe(true);
    expect(() => upiLink({ vpa: "x@y&am=1", name: "n", amountMinor: 1, note: "" })).toThrow();
  });
  it("accepts typical raw UPI IDs, including phone-number IDs", () => {
    for (const id of ["9548967357@ibl", "username@oksbi", "name.surname@okhdfcbank", "a-b_c@ybl"]) expect(isValidUpi(id)).toBe(true);
    for (const id of ["nohandle", "@ibl", "name@", "upi://pay?pa=a@b", "a b@ibl"]) expect(isValidUpi(id)).toBe(false);
  });
  it("normalizes input and extracts the ID from a pasted link", () => {
    expect(normalizeUpi("  9548967357@IBL ")).toBe("9548967357@ibl");
    expect(normalizeUpi("upi://pay?pa=Asha@okaxis&pn=Asha&am=10")).toBe("asha@okaxis");
  });
  it("builds the link from the raw ID at click time", () => {
    expect(upiLink({ vpa: "9548967357@ibl", name: "Ravi Kumar", amountMinor: 25000, note: "Splitequal settle-up" })).toBe("upi://pay?pa=9548967357@ibl&pn=Ravi%20Kumar&am=250.00&cu=INR&tn=Splitequal%20settle-up");
  });
});
