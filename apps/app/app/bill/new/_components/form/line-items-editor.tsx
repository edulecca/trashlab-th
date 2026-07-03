"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "ui-system";

import { useBillDraft, type DraftLineItem } from "@/stores/bill-draft";

/** Square, table-style editor: a header, one editable row per item, and add/remove. */
export function LineItemsEditor() {
  const lineItems = useBillDraft((s) => s.lineItems);
  const setLineItem = useBillDraft((s) => s.setLineItem);
  const addLineItem = useBillDraft((s) => s.addLineItem);
  const removeLineItem = useBillDraft((s) => s.removeLineItem);

  const setItem =
    (index: number, key: keyof DraftLineItem) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setLineItem(index, key, e.target.value);

  return (
    <div className="rounded-none border border-input">
      <div className="flex items-center gap-2 border-b border-input bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span className="flex-1">Description</span>
        <span className="w-36 text-right">Price</span>
        <span className="size-8 shrink-0" aria-hidden="true" />
      </div>

      {lineItems.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 border-b border-input px-3 last:border-b-0"
        >
          <Input
            className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 text-base focus-visible:border-0 focus-visible:ring-0"
            value={item.description}
            onChange={setItem(i, "description")}
            placeholder="Description"
            aria-label={`Line item ${i + 1} description`}
          />
          <Input
            className="h-12 w-36 rounded-none border-0 bg-transparent px-0 text-right text-base tabular-nums focus-visible:border-0 focus-visible:ring-0"
            value={item.amount}
            onChange={setItem(i, "amount")}
            inputMode="decimal"
            placeholder="0.00"
            aria-label={`Line item ${i + 1} price`}
          />
          <button
            type="button"
            onClick={() => removeLineItem(i)}
            aria-label={`Remove line item ${i + 1}`}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => addLineItem()}
        className="flex w-full items-center gap-1.5 border-t border-input px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" />
        Add line item
      </button>
    </div>
  );
}
