"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Persist the reviewed bill draft. The PDF blob (held in the client draft store
 * during review) is saved here as `Bill.file`. Called on "Save draft" — the AI
 * extraction itself never writes to the DB.
 */
export async function saveDraft(fd: FormData) {
  const get = (k: string) => (fd.get(k) as string | null)?.trim() ?? "";

  const vendorName = get("vendorName");
  const vendorEmail = get("vendorEmail");
  const number = get("number");
  const currency = get("currency") || "USD";
  const invoiceDate = get("invoiceDate");
  const dueDate = get("dueDate");
  const description = get("description");

  // Reviewed line items (JSON array of { description, amount }). Drop empty rows.
  type RawItem = { description?: string; amount?: string };
  let rawItems: RawItem[] = [];
  try {
    rawItems = JSON.parse(get("lineItems") || "[]");
  } catch {
    rawItems = [];
  }
  const items = rawItems
    .map((it) => ({
      description: (it.description ?? "").trim(),
      price: parseFloat(it.amount ?? ""),
    }))
    .map((it) => ({ ...it, price: Number.isNaN(it.price) ? 0 : it.price }))
    .filter((it) => it.description !== "" || it.price !== 0);

  const subtotalNum = items.reduce((sum, it) => sum + it.price, 0);
  const taxNum = Math.max(0, parseFloat(get("tax")) || 0);
  // `amount` is the grand total the payer owes: subtotal + tax.
  const total = subtotalNum + taxNum;

  const file = fd.get("file");
  const bytes =
    file instanceof File ? Buffer.from(await file.arrayBuffer()) : null;

  // No auth yet — attribute the upload to the first user (demo).
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found to attribute the bill to.");

  // Vendor matching is deferred: find by name, else create.
  let vendor = vendorName
    ? await prisma.vendor.findFirst({ where: { name: vendorName } })
    : null;
  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: vendorName || "Unknown vendor",
        email: vendorEmail || null,
      },
    });
  }

  const bill = await prisma.bill.create({
    data: {
      number: number || "DRAFT",
      status: "DRAFT",
      source: bytes ? "OCR" : "MANUAL",
      amount: new Prisma.Decimal(total),
      tax: new Prisma.Decimal(taxNum),
      currency,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      file: bytes,
      memo: description || null,
      vendorId: vendor.id,
      uploadedById: user.id,
      // One BillLineItem per reviewed row; quantity flattened to 1 for the MVP.
      lineItems: {
        create: items.map((it, order) => {
          const price = new Prisma.Decimal(it.price);
          return {
            description: it.description || "Item",
            quantity: new Prisma.Decimal(1),
            unitPrice: price,
            total: price,
            type: "EXPENSE" as const,
            order,
          };
        }),
      },
    },
  });

  // Refresh the bill lists that read from the DB.
  revalidatePath("/main");
  revalidatePath("/bill/new");

  return { id: bill.id, hasFile: bytes !== null };
}
