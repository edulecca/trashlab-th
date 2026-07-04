import { notFound, redirect } from "next/navigation";

import { toBillRow } from "@/lib/bill/row";
import { getBillView } from "@/lib/bill/bill-view";
import { visibleBillsWhere } from "@/lib/bill/bills";
import { prisma } from "@/lib/prisma";

import { BillView } from "./_components/bill-view";

export const dynamic = "force-dynamic";

export default async function BillViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const bill = await getBillView(id);
  if (!bill) notFound();
  // Drafts are edited in the create flow, not viewed read-only.
  if (bill.status === "DRAFT") redirect(`/bill/new?id=${id}`);

  // Rail data (same shape as the new-bill screen).
  const bills = await prisma.bill.findMany({
    where: visibleBillsWhere(),
    include: { vendor: true, uploadedBy: true },
    orderBy: { dueDate: "asc" },
  });
  const rows = bills.map((b) => toBillRow(b));

  return <BillView bill={bill} rows={rows} />;
}
