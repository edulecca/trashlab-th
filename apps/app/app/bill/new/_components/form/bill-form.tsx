"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Badge } from "ui-system";

import { useBillTopbar } from "@/app/bill/_components/bill-topbar";
import { useBillDraft, type DraftForm } from "@/stores/bill-draft";
import { saveDraft } from "../../actions";
import { DetailsSection } from "./details-section";
import { FormFooter } from "./form-footer";
import { LineItemsEditor } from "./line-items-editor";
import { TotalsSummary } from "./totals-summary";
import { VendorSection } from "./vendor-section";

/**
 * Create-bill form. Wires the draft store into the (presentational) section
 * components and owns the save/create orchestration + transient save status.
 */
export function BillForm() {
  const form = useBillDraft((s) => s.form);
  const lineItems = useBillDraft((s) => s.lineItems);
  const setField = useBillDraft((s) => s.setField);
  const setLineItem = useBillDraft((s) => s.setLineItem);
  const addLineItem = useBillDraft((s) => s.addLineItem);
  const removeLineItem = useBillDraft((s) => s.removeLineItem);
  const status = useBillDraft((s) => s.status);
  const error = useBillDraft((s) => s.error);
  const file = useBillDraft((s) => s.file);

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
      </div>

      <FormFooter
        saving={saving}
        saved={saved}
        saveError={saveError}
        onSaveDraft={onSaveDraft}
        onCreate={onCreate}
      />
    </div>
  );
}
