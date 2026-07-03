"use client";

import { Input } from "ui-system";

import { money } from "@/lib/format";
import {
  invoiceTotal,
  subtotal as sumItems,
  useBillDraft,
} from "@/stores/bill-draft";

/** Totals breakdown: subtotal (Σ items) + editable tax = invoice total. */
export function TotalsSummary() {
  const form = useBillDraft((s) => s.form);
  const setField = useBillDraft((s) => s.setField);
  const lineItems = useBillDraft((s) => s.lineItems);

  const subtotal = sumItems(lineItems);
  const total = invoiceTotal(lineItems, form.tax);

  return (
    <div className="ml-auto w-full max-w-xs space-y-2 border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">{money(subtotal, form.currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="bill-tax" className="text-muted-foreground">
          Tax
        </label>
        <Input
          id="bill-tax"
          className="w-28 text-right tabular-nums"
          value={form.tax}
          onChange={(e) => setField("tax", e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          aria-label="Tax amount"
        />
      </div>
      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-xs font-medium text-muted-foreground">
          Invoice total
        </span>
        <span className="text-2xl font-semibold tabular-nums">
          {money(total, form.currency)}
        </span>
      </div>
    </div>
  );
}
