import Link from "next/link";
import { Button } from "ui-system";

import { isOverdue } from "@/lib/bills";
import { prisma } from "@/lib/prisma";

import { BillsTable, type BillRow } from "./_components/bills-table";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const bills = await prisma.bill.findMany({
    include: { vendor: true },
    orderBy: { dueDate: "asc" },
  });

  const rows: BillRow[] = bills.map((b) => ({
    id: b.id,
    number: b.number,
    vendor: b.vendor.name,
    status: b.status,
    overdue: isOverdue(b),
    amount: Number(b.amount),
    currency: b.currency,
    dueDate: b.dueDate.toISOString(),
  }));

  const overdueCount = rows.filter((r) => r.overdue).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} bills
            {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/bill/new">New Bill</Link>
        </Button>
      </div>
      <div className="rounded-xl border bg-background p-2">
        <BillsTable rows={rows} />
      </div>
    </div>
  );
}
