"use client";

import { useEffect } from "react";
import { AlertCircle, ChevronDown, Trash2 } from "lucide-react";
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui-system";

import { useBillTopbar } from "@/app/bill/_components/bill-topbar";
import type { BillRow } from "@/lib/bill/row";
import { findDuplicateNumber } from "@/lib/bill/duplicates";
import { useBillDraft } from "@/stores/bill-draft";
import { useDraftActions } from "@/hooks/use-draft-actions";
import { DetailsSection } from "./details-section";
import { FormFooter } from "./form-footer";
import { FormSection } from "./form-section";
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

  // Create-flow mutations (RQ), same pattern as the table's useBillActions.
  const { save, confirm, remove } = useDraftActions();
  const saving = save.isPending || confirm.isPending || remove.isPending;
  const saveError = save.isError ? "Could not save the draft. Try again." : null;

  // Any edit clears the "Draft saved" hint (and a prior save error).
  useEffect(() => {
    save.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => remove.mutate()}
                >
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
        <FormSection title="Line items">
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
        </FormSection>

        <PaymentMethodSection
          value={form.paymentMethod}
          onChange={(value) => setField("paymentMethod", value)}
        />
      </div>

      <FormFooter
        saving={saving}
        extracting={status === "extracting"}
        saved={save.isSuccess}
        saveError={saveError}
        deletable={deletable}
        onDelete={() => remove.mutate()}
        onSaveDraft={() => save.mutate()}
        onConfirm={() => confirm.mutate()}
      />
    </div>
  );
}
