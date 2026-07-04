import { BillsRail } from "@/components/bills-rail";
import { ResizableColumns } from "@/components/resizable-columns";
import { toBillRow } from "@/lib/bill/row";
import { visibleBillsWhere } from "@/lib/bill/bills";
import { getBillView } from "@/lib/bill/bill-view";
import { prisma } from "@/lib/prisma";
import type { InitialDraft } from "@/stores/bill-draft";

import { BillForm } from "./_components/form/bill-form";
import { DocumentPreview } from "./_components/document-preview";

export const dynamic = "force-dynamic";

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // Reopening an existing draft (?id=): load it and rehydrate the form. Only
  // drafts are editable here; anything else belongs in the read-only view.
  const draft = id ? await getBillView(id) : null;
  const initialDraft: InitialDraft | null =
    draft && draft.status === "DRAFT"
      ? {
          id: draft.id,
          form: {
            vendorName: draft.vendorName,
            vendorEmail: draft.vendorEmail,
            number: draft.number,
            invoiceDate: draft.invoiceDate,
            dueDate: draft.dueDate,
            currency: draft.currency,
            description: draft.description,
            tax: draft.tax,
            paymentMethod: draft.paymentMethod,
          },
          lineItems: draft.lineItems,
          fileUrl: draft.hasFile ? `/api/bills/${draft.id}/file` : null,
        }
      : null;

  // Data for the left rail — bills grouped into lifecycle sections.
  const bills = await prisma.bill.findMany({
    where: visibleBillsWhere(),
    include: { vendor: true, uploadedBy: true },
    orderBy: { dueDate: "asc" },
  });
  const rows = bills.map((b) => toBillRow(b));

  return (
    <ResizableColumns
      left={<BillsRail rows={rows} />}
      right={<DocumentPreview />}
    >
      {/* Center — bill form. Empty for a new upload, or prefilled when a draft
          is reopened by id. Gets the loaded bills to flag a duplicate (UI-only). */}
      <BillForm bills={rows} initialDraft={initialDraft} />
    </ResizableColumns>
  );
}
