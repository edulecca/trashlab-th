import type { ChangeEvent } from "react";
import { Input } from "ui-system";

import { money } from "@/lib/format";
import { invoiceTotal, subtotal as sumItems } from "@/lib/line-items";
import type { DraftLineItem } from "@/stores/bill-draft";

/** Totals breakdown: subtotal (Σ items) + tax = invoice total. Tax editable unless disabled. */
export function TotalsSummary({
  lineItems,
  tax,
  currency,
  disabled = false,
  onTaxChange,
}: {
  lineItems: DraftLineItem[];
  tax: string;
  currency: string;
  disabled?: boolean;
  onTaxChange?: (value: string) => void;
}) {
  const subtotal = sumItems(lineItems);
  const total = invoiceTotal(lineItems, tax);

  return (
    <div className="ml-auto w-full max-w-xs space-y-2 border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">{money(subtotal, currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="bill-tax" className="text-muted-foreground">
          Tax
        </label>
        <Input
          id="bill-tax"
          className="w-28 text-right tabular-nums disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:opacity-100"
          value={tax}
          onChange={
            disabled
              ? undefined
              : (e: ChangeEvent<HTMLInputElement>) =>
                  onTaxChange?.(e.target.value)
          }
          inputMode="decimal"
          placeholder="0.00"
          aria-label="Tax amount"
          disabled={disabled}
        />
      </div>
      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-xs font-medium text-muted-foreground">
          Invoice total
        </span>
        <span className="text-2xl font-semibold tabular-nums">
          {money(total, currency)}
        </span>
      </div>
    </div>
  );
}
