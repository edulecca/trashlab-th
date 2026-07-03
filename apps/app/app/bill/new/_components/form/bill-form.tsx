"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, Trash2 } from "lucide-react";
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from "ui-system";

import { useBillTopbar } from "@/app/bill/_components/bill-topbar";
import type { BillRow } from "@/lib/bill-row";
import { findDuplicateNumber } from "@/lib/duplicates";
import { useBillDraft } from "@/stores/bill-draft";
import { confirmBill, deleteBill } from "../../actions";
import { persistDraft } from "../../_lib/persist-draft";
import { DetailsSection } from "./details-section";
import { FormFooter } from "./form-footer";
import { LineItemsEditor } from "./line-items-editor";
import { PaymentMethodSection } from "./payment-method-section";
import { TotalsSummary } from "./totals-summary";
import { VendorSection } from "./vendor-section";

/**
 * Create-bill form. Wires the draft store into the (presentational) section
 * components and owns the save/create orchestration + transient save status.
 */
export function BillForm({ bills }: { bills: BillRow[] }) {
  const form = useBillDraft((s) => s.form);
  const lineItems = useBillDraft((s) => s.lineItems);
  const setField = useBillDraft((s) => s.setField);
  const setLineItem = useBillDraft((s) => s.setLineItem);
  const addLineItem = useBillDraft((s) => s.addLineItem);
  const removeLineItem = useBillDraft((s) => s.removeLineItem);
  const status = useBillDraft((s) => s.status);
  const error = useBillDraft((s) => s.error);
  const billId = useBillDraft((s) => s.billId);
  const reset = useBillDraft((s) => s.reset);

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Any edit to the draft invalidates the "Draft saved" hint.
  useEffect(() => {
    setSaved(false);
  }, [form, lineItems]);

  // Publish the draft's context into the shared /bill top bar.
  useBillTopbar({
    vendorName: form.vendorName,
    vendorImg: null,
    number: form.number,
    statusLabel: "Draft",
  });

  // UI-only duplicate check: does the current draft repeat a loaded bill?
  const duplicateOf = findDuplicateNumber(bills, {
    number: form.number,
    vendor: form.vendorName,
    excludeId: billId ?? undefined,
  });

  // A persisted draft can be deleted (the create screen only holds drafts —
  // confirming navigates away — so a set billId means an editable draft).
  const deletable = billId != null;

  const title =
    form.vendorName && form.number
      ? `${form.vendorName} INV# ${form.number}`
      : "New bill";

  async function onSaveDraft() {
    setSaving(true);
    setSaveError(null);
    try {
      await persistDraft();
      setSaved(true);
    } catch (err) {
      console.error("[bill] save draft failed", err);
      setSaveError("Could not save the draft. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // Confirm: persist the latest form, transition DRAFT → REVIEWED, go to the view.
  async function onConfirm() {
    setSaving(true);
    setSaveError(null);
    try {
      const id = await persistDraft();
      await confirmBill(id);
      toast.success("Bill confirmed.");
      router.push(`/bill/view/${id}`);
    } catch (err) {
      console.error("[bill] confirm failed", err);
      setSaveError("Could not confirm the bill. Try again.");
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!billId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteBill(billId);
      toast.success("Bill deleted.");
      reset();
      router.push("/main");
    } catch (err) {
      console.error("[bill] delete failed", err);
      setSaveError("Could not delete the bill. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <Badge variant="secondary">Draft</Badge>
          </div>
          {deletable ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-3 text-sm font-medium transition-colors hover:bg-muted data-[state=open]:bg-muted">
                <span
                  className="size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                Options
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete()}>
                  <Trash2 />
                  Delete Bill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        {error && status === "error" ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {duplicateOf ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              This bill duplicates <strong>{duplicateOf}</strong>.
            </span>
          </div>
        ) : null}
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 space-y-8 overflow-auto px-8 py-8">
        <VendorSection form={form} onChange={setField} />
        <DetailsSection form={form} lineItems={lineItems} onChange={setField} />
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Line items</h2>
          <LineItemsEditor
            lineItems={lineItems}
            onItemChange={setLineItem}
            onAdd={addLineItem}
            onRemove={removeLineItem}
          />
          <TotalsSummary
            lineItems={lineItems}
            tax={form.tax}
            currency={form.currency}
            onTaxChange={(value) => setField("tax", value)}
          />
        </section>

        <PaymentMethodSection
          value={form.paymentMethod}
          onChange={(value) => setField("paymentMethod", value)}
        />
      </div>

      <FormFooter
        saving={saving}
        extracting={status === "extracting"}
        saved={saved}
        saveError={saveError}
        deletable={deletable}
        onDelete={onDelete}
        onSaveDraft={onSaveDraft}
        onConfirm={onConfirm}
      />
    </div>
  );
}
