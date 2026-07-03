import { BillsRail } from "@/components/bills-rail";
import { ResizableColumns } from "@/components/resizable-columns";
import { toBillRow } from "@/lib/bill-row";
import { prisma } from "@/lib/prisma";

import { BillForm } from "./_components/form/bill-form";
import { DocumentPreview } from "./_components/document-preview";

export const dynamic = "force-dynamic";

export default async function NewBillPage() {
  // Data for the left rail — bills grouped into lifecycle sections.
  const bills = await prisma.bill.findMany({
    include: { vendor: true, uploadedBy: true },
    orderBy: { dueDate: "asc" },
  });
  const rows = bills.map((b) => toBillRow(b));

  return (
    <ResizableColumns
      left={<BillsRail rows={rows} />}
      right={<DocumentPreview />}
    >
      {/* Center — bill form (empty until reviewed / OCR fills it) */}
      <BillForm />
    </ResizableColumns>
  );
}
