"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Input, Textarea } from "ui-system";

import {
  useBillDraft,
  subtotal as sumItems,
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

  const subtotal = sumItems(lineItems);
  const total = invoiceTotal(lineItems, form.tax);
  const vendorComplete = form.vendorName.trim().length > 0;
  const detailsComplete = Boolean(
    form.number && form.invoiceDate && form.dueDate && subtotal > 0
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
      <div className="shrink-0 px-8 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <Badge variant="secondary">Draft</Badge>
        </div>
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
            <Input
              label="Vendor name"
              value={form.vendorName}
              onChange={set("vendorName")}
              placeholder="Acme Inc."
            />
            <Input
              label="Vendor email"
              type="email"
              value={form.vendorEmail}
              onChange={set("vendorEmail")}
              placeholder="billing@acme.com"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Bill details</h2>
            <SectionBadge complete={detailsComplete} />
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

        {/* Line items */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Line items</h2>

          {/* Square, table-style block: header + one editable row per item. */}
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
                  onClick={() => {
                    removeLineItem(i);
                    setSaved(false);
                  }}
                  aria-label={`Remove line item ${i + 1}`}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                addLineItem();
                setSaved(false);
              }}
              className="flex w-full items-center gap-1.5 border-t border-input px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-4" />
              Add line item
            </button>
          </div>

          {/* Totals breakdown: subtotal (Σ items) + tax = invoice total */}
          <div className="ml-auto w-full max-w-xs space-y-2 border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {money(subtotal, form.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="bill-tax" className="text-muted-foreground">
                Tax
              </label>
              <Input
                id="bill-tax"
                className="w-28 text-right tabular-nums"
                value={form.tax}
                onChange={set("tax")}
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
        <Button variant="ghost" size="md" onClick={onSaveDraft} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save draft
        </Button>
        <Button size="md" onClick={onCreate}>Create bill</Button>
      </div>
    </div>
  );
}
