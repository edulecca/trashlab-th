import { Badge } from "ui-system";

import { BillTopbarSetter } from "@/app/bill/_components/bill-topbar";
import { DetailsSection } from "@/app/bill/new/_components/form/details-section";
import { LineItemsEditor } from "@/app/bill/new/_components/form/line-items-editor";
import { TotalsSummary } from "@/app/bill/new/_components/form/totals-summary";
import { VendorSection } from "@/app/bill/new/_components/form/vendor-section";
import { BillsRail } from "@/components/bills-rail";
import { ResizableColumns } from "@/components/resizable-columns";
import type { BillRow } from "@/lib/bill-row";
import { STATUS_DISPLAY } from "@/lib/bill-status";
import type { BillViewData } from "@/lib/bill-view";
import type { DraftForm } from "@/stores/bill-draft";
import { BillPdfPanel } from "./bill-pdf-panel";

/**
 * Read-only bill screen: reuses the create layout + form sections in disabled
 * mode, prefilled from the DB. Right column shows the stored PDF (or empty state).
 */
export function BillView({
  bill,
  rows,
}: {
  bill: BillViewData;
  rows: BillRow[];
}) {
  const form: DraftForm = {
    vendorName: bill.vendorName,
    vendorEmail: bill.vendorEmail,
    number: bill.number,
    invoiceDate: bill.invoiceDate,
    dueDate: bill.dueDate,
    currency: bill.currency,
    description: bill.description,
    tax: bill.tax,
  };

  const status = STATUS_DISPLAY[bill.status];
  const title =
    bill.vendorName && bill.number
      ? `${bill.vendorName} INV# ${bill.number}`
      : "Bill";

  return (
    <ResizableColumns
      left={<BillsRail rows={rows} />}
      right={<BillPdfPanel billId={bill.id} hasFile={bill.hasFile} />}
    >
      <BillTopbarSetter
        vendorName={bill.vendorName}
        vendorImg={bill.vendorImg}
        number={bill.number}
        statusLabel={status.label}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="shrink-0 px-8 pt-8 pb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        {/* Read-only body */}
        <div className="min-h-0 flex-1 space-y-8 overflow-auto px-8 py-8">
          <VendorSection form={form} disabled />
          <DetailsSection form={form} lineItems={bill.lineItems} disabled />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Line items</h2>
            <LineItemsEditor lineItems={bill.lineItems} disabled />
            <TotalsSummary
              lineItems={bill.lineItems}
              tax={bill.tax}
              currency={bill.currency}
              disabled
            />
          </section>
        </div>
      </div>
    </ResizableColumns>
  );
}
