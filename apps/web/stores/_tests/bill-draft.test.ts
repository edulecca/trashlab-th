import { describe, it, expect, beforeEach } from "vitest";

import type { ExtractionData } from "@/lib/extraction/schema";
import { useBillDraft } from "../bill-draft";

beforeEach(() => useBillDraft.getState().reset());

describe("bill-draft store", () => {
  it("setField updates a single form field", () => {
    useBillDraft.getState().setField("vendorName", "Acme");
    expect(useBillDraft.getState().form.vendorName).toBe("Acme");
  });

  it("loadExtraction maps the extraction into the form + line items", () => {
    const data = {
      vendor: { name: "Figma", email: "ap@figma.com" },
      bill: {
        invoiceNumber: "FIG-1",
        invoiceDate: "2026-01-01",
        dueDate: "2026-02-01",
        currency: "USD",
        description: null,
        tax: 5,
        lineItems: [{ description: "Seats", amount: 100 }],
      },
    } as ExtractionData;

    useBillDraft.getState().loadExtraction(data);
    const s = useBillDraft.getState();

    expect(s.form.vendorName).toBe("Figma");
    expect(s.form.number).toBe("FIG-1");
    expect(s.form.tax).toBe("5");
    expect(s.lineItems).toEqual([{ description: "Seats", amount: "100" }]);
    expect(s.status).toBe("ready");
  });
});
