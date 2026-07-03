/**
 * Server-side validation schema for the `saveDraft` server action.
 *
 * A draft is allowed to be *partial* (you can save before every field is filled),
 * so this enforces **bounds, types, enums, and formats** — not required-ness.
 * Required-field checks belong at Confirm (DRAFT → REVIEWED), not here. The file
 * blob (size + magic bytes) is validated separately in the action.
 */
import { z } from "zod";

import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from "@/lib/bill/payment-methods";

const SLUGS: string[] = PAYMENT_METHODS.map((m) => m.slug);

/** Optional money string: empty, or a finite number ≥ 0. Rejects junk like "abc". */
const money = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0), {
    message: "must be a non-negative number",
  });

/** Optional date string: empty, or something `Date.parse` understands. */
const dateStr = z
  .string()
  .trim()
  .max(40)
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), {
    message: "invalid date",
  });

/** One reviewed line-item row as it arrives from the client (both fields strings). */
export const lineItemInput = z.object({
  description: z.string().trim().max(500),
  amount: money,
});

/**
 * The full `saveDraft` payload after FormData is read into a plain object.
 * Unknown keys are stripped. `paymentMethod` is normalized to a known slug
 * (unknown/empty → default) rather than rejected, to stay forgiving.
 */
export const billDraftInput = z.object({
  vendorName: z.string().trim().max(200),
  vendorEmail: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, {
      message: "invalid email",
    }),
  number: z.string().trim().max(100),
  currency: z.string().trim().min(1).max(10),
  invoiceDate: dateStr,
  dueDate: dateStr,
  description: z.string().trim().max(5000),
  tax: money,
  paymentMethod: z
    .string()
    .trim()
    .transform((v) => (SLUGS.includes(v) ? v : DEFAULT_PAYMENT_METHOD)),
  billId: z.string().trim().max(100).optional(),
  lineItems: z.array(lineItemInput).max(200),
});

export type BillDraftInput = z.infer<typeof billDraftInput>;

/** Parse the `lineItems` JSON string into an array (never throws; junk → []). */
export function parseLineItemsJson(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
