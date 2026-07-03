"use client";

import { Input, Textarea } from "ui-system";

import {
  subtotal as sumItems,
  useBillDraft,
  type DraftForm,
} from "@/stores/bill-draft";
import { SectionBadge } from "./section-badge";

/** Bill header fields (invoice #, currency, dates, description). */
export function DetailsSection() {
  const form = useBillDraft((s) => s.form);
  const setField = useBillDraft((s) => s.setField);
  const lineItems = useBillDraft((s) => s.lineItems);

  const set =
    (key: keyof DraftForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, e.target.value);

  const complete = Boolean(
    form.number && form.invoiceDate && form.dueDate && sumItems(lineItems) > 0
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Bill details</h2>
        <SectionBadge complete={complete} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Invoice #"
          value={form.number}
          onChange={set("number")}
          placeholder="INV-0001"
        />
        <Input
          label="Currency"
          className="uppercase"
          value={form.currency}
          onChange={set("currency")}
          placeholder="USD"
          maxLength={3}
        />
        <Input
          label="Invoice date"
          type="date"
          value={form.invoiceDate}
          onChange={set("invoiceDate")}
        />
        <Input
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={set("dueDate")}
        />
        <Textarea
          label="Description"
          containerClassName="sm:col-span-2"
          rows={3}
          value={form.description}
          onChange={set("description")}
          placeholder="What is this bill for?"
        />
      </div>
    </section>
  );
}
