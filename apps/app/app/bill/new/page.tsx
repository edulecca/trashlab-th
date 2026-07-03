import { BillsRail } from "@/components/bills-rail";
import { ResizableColumns } from "@/components/resizable-columns";
import { toBillRow } from "@/lib/bill-row";
import { visibleBillsWhere } from "@/lib/bills";
import { prisma } from "@/lib/prisma";

import { BillForm } from "./_components/form/bill-form";
import { DocumentPreview } from "./_components/document-preview";

export const dynamic = "force-dynamic";

export default async function NewBillPage() {
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
      {/* Center — bill form (empty until reviewed / OCR fills it). Gets the
          loaded bills so it can flag a duplicate draft (UI-only). */}
      <BillForm bills={rows} />
    </ResizableColumns>
  );
}
