import { describe, it, expect } from "vitest";

import { money, formatDate } from "../format";

describe("money", () => {
  it("formats a valid currency, and falls back (no throw) on an invalid one", () => {
    expect(money(1234.5, "USD")).toBe("$1,234.50");
    expect(money(10, "US")).toBe("US 10.00"); // invalid ISO code → fallback
  });
});

describe("formatDate", () => {
  it("formats a date as 'Mon DD, YYYY'", () => {
    expect(formatDate(new Date(2026, 6, 15))).toBe("Jul 15, 2026");
  });
});
