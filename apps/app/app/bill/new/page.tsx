import { SearchField } from "ui-system";

import { formatDate, money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import { BillForm } from "./_components/bill-form";
import { DocumentPreview } from "./_components/document-preview";
import { ResizableColumns } from "./_components/resizable-columns";

export const dynamic = "force-dynamic";

export default async function NewBillPage() {
  // Data for the left rail. The rail component itself lands later from ui-system;
  // for now this column renders a lightweight inline placeholder list.
  const bills = await prisma.bill.findMany({
    include: { vendor: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <ResizableColumns
      left={
        <>
          {/* Left — bill list rail (placeholder until the ui-system component lands) */}
          <div className="shrink-0 px-3">
            <SearchField
              size="sm"
              placeholder="Search bills"
              aria-label="Search bills"
              className="h-11 border-y"
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-auto px-2 pb-2">
            {bills.map((b) => (
              <li key={b.id}>
                <div className="rounded-md px-3 py-2.5 hover:bg-muted">
                  <p className="truncate text-sm font-medium">
                    {b.vendor.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {money(Number(b.amount), b.currency)} · Due{" "}
                    {formatDate(b.dueDate)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      }
      right={<DocumentPreview />}
    >
      {/* Center — bill form (empty until reviewed / OCR fills it) */}
      <BillForm />
    </ResizableColumns>
  );
}
