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
  const amount = get("amount");
  const currency = get("currency") || "USD";
  const invoiceDate = get("invoiceDate");
  const dueDate = get("dueDate");
  const description = get("description");

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

  const amountDec = new Prisma.Decimal(amount || 0);

  const bill = await prisma.bill.create({
    data: {
      number: number || "DRAFT",
      status: "DRAFT",
      source: bytes ? "OCR" : "MANUAL",
      amount: amountDec,
      currency,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      file: bytes,
      memo: description || null,
      vendorId: vendor.id,
      uploadedById: user.id,
      lineItems: {
        create: [
          {
            description: description || number || "Invoice",
            quantity: new Prisma.Decimal(1),
            unitPrice: amountDec,
            total: amountDec,
            type: "EXPENSE",
            order: 0,
          },
        ],
      },
    },
  });

  // Refresh the bill lists that read from the DB.
  revalidatePath("/main");
  revalidatePath("/bill/new");

  return { id: bill.id, hasFile: bytes !== null };
}
