"use client";

import { useState } from "react";
import { Badge, Button, cn } from "ui-system";

/** Shape of the fields an OCR pass extracts from an uploaded invoice. */
export type DetectedBill = {
  vendorName: string;
  vendorEmail: string;
  number: string;
  invoiceDate: string; // yyyy-mm-dd (input[type=date] value)
  dueDate: string; // yyyy-mm-dd
  amount: string;
  currency: string;
  description: string;
};

const EMPTY: DetectedBill = {
  vendorName: "",
  vendorEmail: "",
  number: "",
  invoiceDate: "",
  dueDate: "",
  amount: "",
  currency: "",
  description: "",
};

function SectionBadge({ complete }: { complete: boolean }) {
  return complete ? (
    <Badge variant="success">Complete</Badge>
  ) : (
    <Badge variant="secondary">Missing info</Badge>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function BillForm({ detected }: { detected?: DetectedBill }) {
  const [form, setForm] = useState<DetectedBill>(detected ?? EMPTY);

  const set =
    (key: keyof DetectedBill) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const vendorComplete = form.vendorName.trim().length > 0;
  const detailsComplete = Boolean(
    form.number && form.amount && form.invoiceDate && form.dueDate
  );

  const title =
    form.vendorName && form.number
      ? `${form.vendorName} INV# ${form.number}`
      : "New bill";

  function onSaveDraft() {
    // Stubbed — persistence lands in a follow-up change.
    console.log("[bill] save draft", form);
  }

  function onCreate() {
    // Stubbed — persistence lands in a follow-up change.
    console.log("[bill] create bill", form);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8">
        <Badge variant="secondary">Draft</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 space-y-8 overflow-auto px-8 py-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Vendor</h2>
            <SectionBadge complete={vendorComplete} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor name">
              <input
                className={inputClass}
                value={form.vendorName}
                onChange={set("vendorName")}
                placeholder="Acme Inc."
              />
            </Field>
            <Field label="Vendor email">
              <input
                className={inputClass}
                value={form.vendorEmail}
                onChange={set("vendorEmail")}
                placeholder="billing@acme.com"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Bill details</h2>
            <SectionBadge complete={detailsComplete} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice #">
              <input
                className={inputClass}
                value={form.number}
                onChange={set("number")}
                placeholder="INV-0001"
              />
            </Field>
            <Field label="Amount">
              <div className="flex gap-2">
                <input
                  className={cn(inputClass, "w-20")}
                  value={form.currency}
                  onChange={set("currency")}
                  placeholder="USD"
                  aria-label="Currency"
                />
                <input
                  className={cn(inputClass, "flex-1 tabular-nums")}
                  value={form.amount}
                  onChange={set("amount")}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Amount"
                />
              </div>
            </Field>
            <Field label="Invoice date">
              <input
                type="date"
                className={inputClass}
                value={form.invoiceDate}
                onChange={set("invoiceDate")}
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                className={inputClass}
                value={form.dueDate}
                onChange={set("dueDate")}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className={cn(inputClass, "h-24 resize-none py-2")}
                value={form.description}
                onChange={set("description")}
                placeholder="What is this bill for?"
              />
            </Field>
          </div>
        </section>
      </div>

      {/* Sticky footer actions */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-background px-8 py-3">
        <Button variant="ghost" onClick={onSaveDraft}>
          Save draft
        </Button>
        <Button onClick={onCreate}>Create bill</Button>
      </div>
    </div>
  );
}
