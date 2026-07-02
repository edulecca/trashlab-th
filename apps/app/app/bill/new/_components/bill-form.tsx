"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge, Button, cn } from "ui-system";

import {
  useBillDraft,
  invoiceTotal,
  type DraftForm,
  type DraftLineItem,
} from "@/stores/bill-draft";
import { saveDraft } from "../actions";

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

/** Currency formatter that tolerates an empty/invalid code. */
function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${(currency || "USD").toUpperCase()} ${amount.toFixed(2)}`;
  }
}

export function BillForm() {
  // The form binds to the shared draft store: the AI extraction pre-fills it,
  // the user edits from there, and save persists it.
  const form = useBillDraft((s) => s.form);
  const setField = useBillDraft((s) => s.setField);
  const lineItems = useBillDraft((s) => s.lineItems);
  const setLineItem = useBillDraft((s) => s.setLineItem);
  const addLineItem = useBillDraft((s) => s.addLineItem);
  const removeLineItem = useBillDraft((s) => s.removeLineItem);
  const status = useBillDraft((s) => s.status);
  const error = useBillDraft((s) => s.error);
  const file = useBillDraft((s) => s.file);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set =
    (key: keyof DraftForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setField(key, e.target.value);
      setSaved(false);
    };

  const setItem =
    (index: number, key: keyof DraftLineItem) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLineItem(index, key, e.target.value);
      setSaved(false);
    };

  const total = invoiceTotal(lineItems);
  const vendorComplete = form.vendorName.trim().length > 0;
  const detailsComplete = Boolean(
    form.number && form.invoiceDate && form.dueDate && total > 0
  );

  const title =
    form.vendorName && form.number
      ? `${form.vendorName} INV# ${form.number}`
      : "New bill";

  async function onSaveDraft() {
    setSaving(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      (Object.keys(form) as (keyof DraftForm)[]).forEach((k) =>
        fd.append(k, form[k])
      );
      fd.append("lineItems", JSON.stringify(lineItems));
      // The PDF blob (held in the store during review) is persisted as Bill.file.
      if (file) fd.append("file", file);
      await saveDraft(fd);
      setSaved(true);
    } catch (err) {
      console.error("[bill] save draft failed", err);
      setSaveError("Could not save the draft. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function onCreate() {
    // Stubbed — the full create/approve flow lands in a follow-up change.
    console.log("[bill] create bill", { form, lineItems });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8">
        <Badge variant="secondary">Draft</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        {error && status === "error" ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
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
            <Field label="Currency">
              <input
                className={cn(inputClass, "uppercase")}
                value={form.currency}
                onChange={set("currency")}
                placeholder="USD"
                maxLength={3}
              />
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

        {/* Line items */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Line items</h2>

          <div className="space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={cn(inputClass, "flex-1")}
                  value={item.description}
                  onChange={setItem(i, "description")}
                  placeholder="Description"
                  aria-label={`Line item ${i + 1} description`}
                />
                <input
                  className={cn(inputClass, "w-36 tabular-nums")}
                  value={item.amount}
                  onChange={setItem(i, "amount")}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={`Line item ${i + 1} price`}
                />
                <button
                  type="button"
                  onClick={() => {
                    removeLineItem(i);
                    setSaved(false);
                  }}
                  aria-label={`Remove line item ${i + 1}`}
                  className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                addLineItem();
                setSaved(false);
              }}
            >
              <Plus data-icon="inline-start" />
              Add line item
            </Button>

            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">
                Invoice total
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {money(total, form.currency)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky footer actions */}
      <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-background px-8 py-3">
        {saveError ? (
          <span className="mr-auto flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {saveError}
          </span>
        ) : saved ? (
          <span className="mr-auto flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            Draft saved
          </span>
        ) : null}
        <Button variant="ghost" onClick={onSaveDraft} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save draft
        </Button>
        <Button onClick={onCreate}>Create bill</Button>
      </div>
    </div>
  );
}
