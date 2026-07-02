## 1. Data model

- [x] 1.1 Add `tax Decimal @db.Decimal(12,2) @default(0)` to `Bill` in `prisma/schema.prisma`
- [x] 1.2 Run `prisma migrate dev` (name e.g. `bill_tax`) and `prisma generate`
- [x] 1.3 Update seed so a couple of demo bills carry a plausible `tax` (keep `amount` = subtotal + tax)

## 2. AI extraction

- [x] 2.1 Add `tax: z.number().nullable()` to `extractionSchema.bill` in `lib/ai/schema.ts`
- [x] 2.2 Update the extractor prompt in `lib/ai/prompts.ts`: exclude tax-like lines from `lineItems`, sum all tax lines into `bill.tax`, keep shipping/discounts as items, `null` when no tax

## 3. Draft store

- [x] 3.1 Add `tax` to the store shape (as a `form` field; `setField` covers it — no separate `setTax` needed) in `stores/bill-draft.ts`
- [x] 3.2 Map extraction `bill.tax` into the store (null → "0")
- [x] 3.3 Expose derived `subtotal()` (Σ line items) and `invoiceTotal(items, tax)` = subtotal + tax (NaN → 0)

## 4. Form UI

- [x] 4.1 In `bill-form.tsx` replace the single total with a Subtotal (read-only) / Tax (editable) / Invoice total (read-only) breakdown
- [x] 4.2 Keep "details complete" logic consistent with the new fields

## 5. Persistence

- [x] 5.1 In `actions.ts` `saveDraft`, read `tax` from FormData; set `Bill.tax` and `Bill.amount = subtotal + tax`

## 6. Verification

- [x] 6.1 `tsc --noEmit` clean
- [x] 6.2 Extract a sample PDF with a tax line → tax lands in the Tax field, not in line items; total = subtotal + tax
- [x] 6.3 Save draft → verify `Bill.tax` and `Bill.amount = subtotal + tax` in the DB
