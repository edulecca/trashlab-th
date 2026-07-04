import { describe, it, expect } from "vitest";

import type { BillRow } from "../row";
import { annotateDuplicates, findDuplicate } from "../duplicates";

const row = (
  id: string,
  number: string,
  vendor: string,
  uploadedAt: string
): BillRow => ({
  id,
  number,
  vendor,
  vendorImg: null,
  uploadedBy: "u",
  uploadedAt,
  status: "DRAFT",
  overdue: false,
  amount: 1,
  currency: "USD",
  dueDate: "",
  duplicateOf: null,
});

describe("annotateDuplicates", () => {
  it("flags the later bill as a duplicate of the earliest (same number + vendor)", () => {
    const [a, b] = annotateDuplicates([
      row("a", "INV-1", "Acme", "2026-01-01"),
      row("b", "INV-1", "Acme", "2026-02-01"),
    ]);
    expect(a.duplicateOf).toBeNull(); // original
    expect(b.duplicateOf).toBe("INV-1"); // duplicate
  });

  it("never flags across different vendors or blank/placeholder numbers", () => {
    const out = annotateDuplicates([
      row("a", "INV-1", "Acme", "2026-01-01"),
      row("b", "INV-1", "Other", "2026-02-01"), // different vendor
      row("c", "", "Acme", "2026-01-01"), // blank
      row("d", "DRAFT", "Acme", "2026-02-01"), // placeholder
    ]);
    expect(out.every((r) => r.duplicateOf === null)).toBe(true);
  });
});

describe("findDuplicate", () => {
  it("returns the matching bill (excluding self); null for a blank number", () => {
    const rows = [row("a", "INV-1", "Acme", "2026-01-01")];
    expect(
      findDuplicate(rows, { number: "INV-1", vendor: "Acme", excludeId: "b" })?.id
    ).toBe("a");
    expect(findDuplicate(rows, { number: "", vendor: "Acme" })).toBeNull();
  });

  it("does NOT flag the original (earliest) draft even when a later duplicate exists", () => {
    const rows = [
      row("a", "INV-1", "Acme", "2026-01-01"), // original
      row("b", "INV-1", "Acme", "2026-02-01"), // later duplicate
    ];
    // Reopening the original 'a' → not a duplicate.
    expect(
      findDuplicate(rows, { number: "INV-1", vendor: "Acme", excludeId: "a" })
    ).toBeNull();
    // Reopening the later 'b' → duplicate, points at the original 'a'.
    expect(
      findDuplicate(rows, { number: "INV-1", vendor: "Acme", excludeId: "b" })?.id
    ).toBe("a");
  });
});
