## Why

Invoices commonly split money into a subtotal (goods/services) plus one or more tax lines (VAT, sales tax, surcharges). Today the `Bill` has no `tax` field, so the AI extractor folds tax into the line-items list — polluting the item list with non-item rows and destroying the subtotal/tax/total breakdown a payer needs to review.

## What Changes

- Add a dedicated `tax` money field to `Bill` (`Decimal(12,2)`, default `0`). `amount` **stays the grand total** the payer owes (Option A); subtotal is derived (`amount − tax`, equivalently `Σ line items`).
- AI extraction pulls tax **out** of line items into a single `bill.tax`, **summing all tax-like lines** (VAT + sales tax + surcharge, etc.) into that one value. Line items keep only real goods/services.
- Draft store carries `tax` and exposes derived `subtotal` / `invoiceTotal` (subtotal + tax).
- Bill form shows a **Subtotal / Tax / Invoice total** breakdown (tax editable) in place of the single total.
- `saveDraft` persists `tax`; sets `Bill.amount = subtotal + tax`.

## Capabilities

### New Capabilities
- `bill-tax`: A bill records tax as a dedicated field distinct from line items; extraction sums all tax lines into it and keeps items tax-free.

### Modified Capabilities
- `billpay-data-model`: the `Bill` entity gains a `tax` Decimal field alongside `amount`.
- `ai-bill-extraction`: the extraction contract separates tax from line items and sums multiple tax lines.
- `bill-draft-persistence`: `saveDraft` persists `tax` and computes `amount = subtotal + tax`.

## Impact

- **Prisma**: `Bill.tax Decimal @db.Decimal(12,2) @default(0)` + migration; seed updated so demo bills carry a plausible tax.
- **Code**: `lib/ai/schema.ts` (Zod), `lib/ai/prompts.ts`, `stores/bill-draft.ts`, `app/bill/new/_components/bill-form.tsx`, `app/bill/new/actions.ts`.
- **No API/route signature changes**; `/api/extract` response gains one field.
