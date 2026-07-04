import { describe, it, expect } from "vitest";

import { subtotal, invoiceTotal } from "../line-items";

describe("line-item math", () => {
  it("subtotal sums amounts, treating non-numeric/blank as 0", () => {
    expect(
      subtotal([{ amount: "10" }, { amount: "5.5" }, { amount: "" }, { amount: "x" }])
    ).toBe(15.5);
  });

  it("invoiceTotal = subtotal + tax", () => {
    expect(invoiceTotal([{ amount: "100" }], "8.5")).toBe(108.5);
  });
});
