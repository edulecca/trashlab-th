import { prisma } from "@/lib/prisma";
import { visibleBillsWhere } from "@/lib/bill/bills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV-escape a cell: wrap in quotes and double any inner quotes when needed. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * GET /api/bills/export?id=A&id=B — the selected bills as a downloadable CSV.
 * `id` is repeatable; DELETED bills are excluded. Empty selection → 400.
 */
export async function GET(req: Request) {
  const ids = new URL(req.url).searchParams.getAll("id");
  if (ids.length === 0) {
    return new Response("No bills selected.", { status: 400 });
  }

  const bills = await prisma.bill.findMany({
    where: { ...visibleBillsWhere(), id: { in: ids } },
    include: { vendor: true },
    orderBy: { dueDate: "asc" },
  });

  const header = [
    "Vendor",
    "Invoice",
    "Status",
    "Amount",
    "Currency",
    "Invoice date",
    "Due date",
  ];
  const rows = bills.map((b) => [
    b.vendor.name,
    b.number,
    b.status,
    Number(b.amount).toFixed(2),
    b.currency,
    iso(b.invoiceDate),
    iso(b.dueDate),
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map(csvCell).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bills.csv"`,
    },
  });
}
