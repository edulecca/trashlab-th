## Context

The extractor returns `bill.lineItems: { description, amount }[]`, but `stores/bill-draft.ts` maps that
to a single summed `amount` string and `bill-form.tsx` renders one Amount input. This change lifts line
items to first-class, editable state in the form (Ramp-style), keeping the AI-captured detail.

## Goals / Non-Goals

**Goals:**
- Show detected line items as editable rows (description + price), add/remove, live invoice total.
- Store the real `lineItems` array; persist it as `BillLineItem` rows on save.

**Non-Goals:**
- Ramp's extra per-item fields (GL account, category, department, class, billable), quantity/unit-price
  breakdown, reconciliation warnings.

## Decisions

**1. `lineItems` become the store's source of truth for amounts; total is derived.**
The draft store holds `lineItems: { description: string; amount: string }[]` (amount kept as a string so
inputs stay controlled and editable, parsed to a number only for the total and on save). The single
`amount` form field is removed; the "Invoice total" is a computed `sum(parseFloat(amount))`, never stored
as editable state. Extraction maps its items straight into `lineItems`; a manual bill starts with one
empty row.

**2. Minimal row shape (description + price).**
Per the requested UI, each row is just a description input and a price input, with a remove control and
an "Add line item" button appending an empty row. The richer Ramp fields are explicitly out of scope.

**3. Persist one `BillLineItem` per row; `Bill.amount` = their sum.**
`saveDraft` iterates the rows: for each, `description`, `quantity = 1`, `unitPrice = total = row price`,
`type = EXPENSE`, `order = index`. This replaces the previous single synthetic item. `Bill.amount` is the
sum. Empty rows (no description and no price) are skipped.

## Risks / Trade-offs

- **Amount as a string in the store** → parsed defensively (`parseFloat` with NaN → 0) for the total and
  on save; avoids fighting controlled-input UX.
- **Line items that don't reconcile to an invoice-stated total** → out of scope; the total shown is
  purely the sum of rows, which the reviewer controls.
- **quantity/unitPrice flattened to the row price** → acceptable for the MVP; the schema keeps the columns
  so a richer breakdown is a clean later change.
