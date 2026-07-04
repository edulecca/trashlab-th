import { describe, it, expect } from "vitest";

import type { BillRow } from "../row";
import { billHref, isOverdue, matchesBillSearch } from "../bills";

describe("isOverdue", () => {
  const past = new Date("2020-01-01");
  const now = new Date("2026-01-01");

  it("is true when past due and not paid, false once paid", () => {
    expect(isOverdue({ dueDate: past, status: "APPROVED" }, now)).toBe(true);
    expect(isOverdue({ dueDate: past, status: "PAID" }, now)).toBe(false);
  });
});

const row = (over: Partial<BillRow> = {}): BillRow => ({
  id: "1",
  number: "INV-9",
  vendor: "Acme",
  vendorImg: null,
  uploadedBy: "u",
  uploadedAt: "",
  status: "DRAFT",
  overdue: false,
  amount: 1,
  currency: "USD",
  dueDate: "",
  duplicateOf: null,
  ...over,
});

describe("matchesBillSearch", () => {
  it("matches vendor or invoice (case-insensitive); empty query matches all", () => {
    expect(matchesBillSearch(row(), "acme")).toBe(true);
    expect(matchesBillSearch(row(), "inv-9")).toBe(true);
    expect(matchesBillSearch(row(), "")).toBe(true);
    expect(matchesBillSearch(row(), "zzz")).toBe(false);
  });
});

describe("billHref", () => {
  it("drafts open the create flow, everything else the read-only view", () => {
    expect(billHref("x", "DRAFT")).toBe("/bill/new?id=x");
    expect(billHref("x", "PAID")).toBe("/bill/view/x");
  });
});
