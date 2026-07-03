"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma, type BillStatus } from "@/generated/prisma/client";
import { findOrCreateVendor } from "@/lib/vendors";
import { DEFAULT_PAYMENT_METHOD } from "@/lib/payment-methods";
import { billDraftInput, parseLineItemsJson } from "@/lib/bill-draft-input";
import { MAX_FILE_BYTES } from "@/lib/ai/config";

const PDF_MAGIC = "%PDF-";

/**
 * Persist the reviewed bill draft. The PDF blob (held in the client draft store
 * during review) is saved here as `Bill.file`. Called on "Save draft" — the AI
 * extraction itself never writes to the DB.
 */
export async function saveDraft(fd: FormData) {
  const get = (k: string) => (fd.get(k) as string | null)?.trim() ?? "";

  // Validate the payload (bounds/types/enums/formats) before touching the DB. A
  // draft may be partial, so this enforces shape — not required-ness — and throws
  // on abuse: over-long strings, non-numeric amounts, bad dates/email, or a
  // malformed line-item array.
  const parsed = billDraftInput.safeParse({
    vendorName: get("vendorName"),
    vendorEmail: get("vendorEmail"),
    number: get("number"),
    currency: get("currency") || "USD",
    invoiceDate: get("invoiceDate"),
    dueDate: get("dueDate"),
    description: get("description"),
    tax: get("tax"),
    paymentMethod: get("paymentMethod"),
    billId: get("billId") || undefined,
    lineItems: parseLineItemsJson(get("lineItems")),
  });
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid bill draft — ${detail}`);
  }
  const input = parsed.data;

  // Drop empty rows; amounts are already validated as non-negative numeric strings.
  const items = input.lineItems
    .map((it) => ({
      description: it.description,
      price: it.amount === "" ? 0 : Number(it.amount),
    }))
    .filter((it) => it.description !== "" || it.price !== 0);

  const subtotalNum = items.reduce((sum, it) => sum + it.price, 0);
  const taxNum = input.tax === "" ? 0 : Number(input.tax);
  // `amount` is the grand total the payer owes: subtotal + tax.
  const total = subtotalNum + taxNum;

  // The PDF blob is validated here too — saveDraft is a direct entry point, not
  // only reached via /api/extract: size cap + real-PDF magic bytes. (Left
  // unannotated so `bytes` infers the narrow Buffer type Prisma's Bytes expects.)
  const file = fd.get("file");
  if (file instanceof File && file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Attached PDF is larger than ${Math.round(MAX_FILE_BYTES / 1024)}KB.`
    );
  }
  const bytes =
    file instanceof File ? Buffer.from(await file.arrayBuffer()) : null;
  if (bytes && bytes.subarray(0, 5).toString("latin1") !== PDF_MAGIC) {
    throw new Error("Attached file is not a PDF.");
  }

  // No auth yet — attribute the upload to the first user (demo).
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found to attribute the bill to.");

  // Reuse the vendor from the scan (or an earlier bill) — deduped by name + email.
  const vendor = await findOrCreateVendor(input.vendorName, input.vendorEmail);

  // One BillLineItem per reviewed row; quantity flattened to 1 for the MVP.
  const lineItemsCreate = items.map((it, order) => {
    const price = new Prisma.Decimal(it.price);
    return {
      description: it.description || "Item",
      quantity: new Prisma.Decimal(1),
      unitPrice: price,
      total: price,
      type: "EXPENSE" as const,
      order,
    };
  });

  const shared = {
    number: input.number || "DRAFT",
    amount: new Prisma.Decimal(total),
    tax: new Prisma.Decimal(taxNum),
    currency: input.currency,
    invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : new Date(),
    dueDate: input.dueDate ? new Date(input.dueDate) : new Date(),
    memo: input.description || null,
    paymentMethod: input.paymentMethod,
    vendorId: vendor.id,
  };

  // Upsert: update the existing draft in place, else create a new one. Status
  // is never touched here — transitions go through approveBill / payBill.
  const billId = input.billId;
  const bill = billId
    ? await prisma.bill.update({
        where: { id: billId },
        data: {
          ...shared,
          // Only overwrite the stored PDF when a new one is provided.
          ...(bytes ? { file: bytes } : {}),
          lineItems: { deleteMany: {}, create: lineItemsCreate },
        },
      })
    : await prisma.bill.create({
        data: {
          ...shared,
          status: "DRAFT",
          source: bytes ? "OCR" : "MANUAL",
          file: bytes,
          uploadedById: user.id,
          lineItems: { create: lineItemsCreate },
        },
      });

  // Refresh the bill lists that read from the DB.
  revalidatePath("/main");
  revalidatePath("/bill/new");
  revalidatePath(`/bill/view/${bill.id}`);

  return { id: bill.id, hasFile: bytes !== null };
}

function revalidateBill(id: string) {
  revalidatePath("/main");
  revalidatePath(`/bill/view/${id}`);
}

/**
 * Advance a bill from one status to the next in a single guarded write: the
 * `where` clause enforces the source status, so `count === 0` means the bill is
 * missing or not in the expected state.
 */
async function transition(
  id: string,
  from: BillStatus,
  to: BillStatus,
  extra: Prisma.BillUncheckedUpdateManyInput = {}
) {
  const { count } = await prisma.bill.updateMany({
    where: { id, status: from },
    data: { status: to, ...extra },
  });
  if (count === 0) throw new Error(`Cannot move bill to ${to}.`);
  revalidateBill(id);
}

/** Soft-delete a DRAFT bill: mark it DELETED (hidden from every fetch). Drafts only. */
export async function deleteBill(id: string) {
  // Guarded: the `where` enforces DRAFT, so count === 0 means it's missing or
  // already past draft. The row stays (tombstone) but is excluded everywhere.
  const { count } = await prisma.bill.updateMany({
    where: { id, status: "DRAFT" },
    data: { status: "DELETED" },
  });
  if (count === 0) throw new Error("Cannot delete this bill.");
  revalidatePath("/main");
  revalidatePath("/bill/new");
}

/** DRAFT → REVIEWED. Fields are saved by `saveDraft` just before this. */
export async function confirmBill(id: string) {
  await transition(id, "DRAFT", "REVIEWED");
}

/** REVIEWED → APPROVED (a separate approval step, possibly a different role). */
export async function approveBill(id: string) {
  const approver = await prisma.user.findFirst({ select: { id: true } });
  await transition(id, "REVIEWED", "APPROVED", {
    approvedById: approver?.id ?? null,
  });
}

/** APPROVED → PAID. Records a Payment with the bill's chosen method. */
export async function payBill(id: string) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    select: { status: true, amount: true, paymentMethod: true },
  });
  if (!bill) throw new Error("Bill not found.");
  if (bill.status !== "APPROVED")
    throw new Error(`Cannot pay a ${bill.status} bill.`);

  const slug = bill.paymentMethod ?? DEFAULT_PAYMENT_METHOD;
  const method = await prisma.paymentMethod.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!method) throw new Error(`Unknown payment method: ${slug}`);

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        billId: id,
        paymentMethodId: method.id,
        amount: bill.amount,
        status: "PAID",
        processedAt: new Date(),
      },
    }),
    prisma.bill.update({ where: { id }, data: { status: "PAID" } }),
  ]);

  revalidateBill(id);
}
