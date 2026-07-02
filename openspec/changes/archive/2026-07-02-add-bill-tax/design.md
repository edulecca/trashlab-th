## Context

`Bill` currently models money as a single `amount` (grand total) plus `BillLineItem` rows. There is no tax concept anywhere: not on the model, not in the AI extraction schema (`lib/ai/schema.ts` has only `lineItems[{description, amount}]`), not in the draft store or form. Real invoices state a subtotal plus one or more tax lines, so the extractor currently emits tax as just another line item, which double-counts semantics and clutters the item list.

## Goals / Non-Goals

**Goals:**
- A single `tax` money field on `Bill`, distinct from line items.
- `amount` remains the grand total the payer owes (Option A). Subtotal is always derivable, never stored.
- Extraction separates tax from items and collapses multiple tax lines into one summed value.
- Form shows Subtotal / Tax / Invoice total; tax is editable.

**Non-Goals:**
- Per-line tax rates, tax jurisdictions, or a tax-code catalog.
- Tax-exempt flags, reverse-charge, or withholding.
- Changing `Payment` or approval flows.

## Decisions

**D1 — `amount` = grand total, `tax` separate; subtotal derived (Option A).**
Chosen over storing subtotal in `amount` (Option B). Rationale: `amount` is already consumed across the app (lists, seed, persistence) as "what you pay"; keeping that invariant avoids reinterpreting an existing field. Invariant: `amount = Σ line items + tax`. Subtotal (`amount − tax`) is computed on read, never stored — consistent with the existing "overdue is derived, never stored" principle.

**D2 — One scalar `tax` field, not a `TAX` line-item type.**
Alternative was extending `LineItemType` with `TAX` and keeping tax as a row. Rejected: line items represent goods/services and feed the subtotal; a tax row would re-pollute the subtotal sum and force every consumer to filter by type. A dedicated `Decimal(12,2) @default(0)` column is simpler and matches how the form wants to render it.

**D3 — Extractor sums all tax-like lines into `bill.tax`.**
The prompt instructs the model to recognize any tax/VAT/GST/sales-tax/surcharge line, exclude it from `lineItems`, and return the **sum** of all such lines as `bill.tax` (number, or `null`/`0` when none is stated). Keeps the item list clean and gives one number to persist.

**D4 — Default `0`, nullable-in-transit.**
DB column defaults to `0` (non-null) so existing/seed rows are valid. The extraction schema uses `tax: number | null` (null = "not stated"), which the store coerces to `0` for math and persistence.

## Risks / Trade-offs

- [Subtotal ≠ Σ items if data drifts] The invariant `amount = Σ items + tax` must be enforced at save time. → `saveDraft` always computes `amount = subtotal + tax`; it never trusts a client-sent total.
- [Model mis-buckets a discount/shipping as tax] Only tax-like lines are summed; shipping/discounts stay as line items per the prompt. → Tax field is user-editable in the form before save.
- [Existing bills have `tax = 0`] Seed rows currently imply tax-inclusive totals. → Migration defaults to `0`; seed is updated to set a realistic tax on a couple of demo bills so the UI shows the breakdown.

## Migration Plan

1. Add `tax Decimal @db.Decimal(12,2) @default(0)` to `Bill`; `prisma migrate dev` (additive, non-breaking — default backfills existing rows).
2. Update seed so demo bills carry a plausible `tax` (and `amount` stays the total).
3. Ship schema/prompt/store/form/action changes together. Rollback = revert migration (drop column) + code.
