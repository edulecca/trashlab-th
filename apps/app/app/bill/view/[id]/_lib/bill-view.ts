import type { BillStatus } from "@/lib/bill/row";
import { DEFAULT_PAYMENT_METHOD } from "@/lib/bill/payment-methods";
import { prisma } from "@/lib/prisma";

/** A read-only line item as the view form renders it (description + amount). */
export type BillViewLineItem = { description: string; amount: string };

/** Everything the read-only bill view needs — no file bytes, just `hasFile`. */
export type BillViewData = {
  id: string;
  status: BillStatus;
  number: string;
  vendorName: string;
  vendorImg: string | null;
  vendorEmail: string;
  currency: string;
  invoiceDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  tax: string;
  description: string;
  paymentMethod: string;
  hasFile: boolean;
  lineItems: BillViewLineItem[];
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Load a single bill for the read-only view: vendor + ordered line items, all
 * display fields except the (large) file bytes. `hasFile` is derived with a
 * narrow `file IS NOT NULL` projection so the blob never reaches the page.
 * Returns `null` for an unknown id.
 */
export async function getBillView(id: string): Promise<BillViewData | null> {
  const bill = await prisma.bill.findUnique({
    where: { id },
    omit: { file: true },
    include: {
      vendor: true,
      lineItems: { orderBy: { order: "asc" } },
    },
  });
  if (!bill || bill.status === "DELETED") return null;

  const [flag] = await prisma.$queryRaw<{ hasFile: boolean }[]>`
    SELECT ("file" IS NOT NULL) AS "hasFile" FROM "Bill" WHERE "id" = ${id}
  `;

  return {
    id: bill.id,
    status: bill.status,
    number: bill.number,
    vendorName: bill.vendor.name,
    vendorImg: bill.vendor.img,
    vendorEmail: bill.vendor.email ?? "",
    currency: bill.currency,
    invoiceDate: isoDate(bill.invoiceDate),
    dueDate: isoDate(bill.dueDate),
    tax: String(bill.tax),
    description: bill.memo ?? "",
    paymentMethod: bill.paymentMethod ?? DEFAULT_PAYMENT_METHOD,
    hasFile: flag?.hasFile ?? false,
    lineItems: bill.lineItems.map((li) => ({
      description: li.description,
      amount: String(li.total),
    })),
  };
}
