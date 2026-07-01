/**
 * Shared schemas & result contract for AI bill extraction.
 *
 * These Zod schemas are the single source of truth for both the server agents
 * (constrained model output) and the client form (draft store types).
 */
import { z } from "zod";

/** Classifier agent output: is the uploaded document an invoice/bill? */
export const classificationSchema = z.object({
  isBill: z.boolean(),
  reason: z.string().describe("Short justification for the decision."),
});
export type Classification = z.infer<typeof classificationSchema>;

/** A single invoice line item. */
export const lineItemSchema = z.object({
  description: z.string(),
  amount: z.number().describe("Line amount as a number, no currency symbol."),
});
export type LineItem = z.infer<typeof lineItemSchema>;

/**
 * Extractor agent output. Fields absent from the document MUST be null — the
 * model is instructed never to fabricate. Dates are ISO `YYYY-MM-DD`.
 */
export const extractionSchema = z.object({
  vendor: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  bill: z.object({
    invoiceNumber: z.string().nullable(),
    invoiceDate: z.string().nullable().describe("ISO YYYY-MM-DD or null."),
    dueDate: z.string().nullable().describe("ISO YYYY-MM-DD or null."),
    currency: z.string().nullable().describe("ISO 4217 code, e.g. USD."),
    description: z.string().nullable(),
    lineItems: z.array(lineItemSchema),
  }),
});
export type ExtractionData = z.infer<typeof extractionSchema>;

/** Typed error codes returned by the /api/extract endpoint. */
export const ERROR_CODES = [
  "INVALID_TYPE",
  "TOO_LARGE",
  "TOO_MANY_PAGES",
  "ENCRYPTED",
  "NOT_A_BILL",
  "EXTRACTION_FAILED",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type ExtractError = { code: ErrorCode; message: string };

/** Discriminated result the endpoint always returns. */
export type ExtractResult =
  | { ok: true; data: ExtractionData }
  | { ok: false; error: ExtractError };
