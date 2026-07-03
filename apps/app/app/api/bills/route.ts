import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { BILL_STATUSES, toBillRow, type BillStatus } from "@/lib/bill-row";

// Prisma + always-fresh reads.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/bills?status=A&status=B — bills as table rows, JSON.
 * `status` is repeatable; unknown values are ignored; none = all bills.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const statuses = params
    .getAll("status")
    .filter((s): s is BillStatus => (BILL_STATUSES as string[]).includes(s));

  const bills = await prisma.bill.findMany({
    where: statuses.length ? { status: { in: statuses } } : undefined,
    include: { vendor: true, uploadedBy: true },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  return NextResponse.json(bills.map((b) => toBillRow(b, now)));
}
