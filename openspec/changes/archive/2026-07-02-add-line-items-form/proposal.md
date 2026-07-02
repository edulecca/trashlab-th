## Why

The extractor already returns each invoice line item (`{ description, amount }`), but the draft store
collapses them into a single summed "Amount" field and the form only shows that total. Reviewers can't
see or correct the individual items — losing the detail Ramp surfaces and the fidelity the AI already
captured.

## What Changes

- Replace the single **Amount** input in the create-bill form with an **editable line-items list**:
  one row per item with a **description** input and a **price** input (only those two per row — no GL
  account / category / department / class / billable fields).
- Add an **"Add line item"** button below the list to append an empty row, and a per-row remove control.
- Show an **"Invoice total"** = sum of all line-item prices (read-only, updates live).
- The draft store holds the real **`lineItems` array** (populated from extraction), not a summed amount;
  the form binds to it.
- **Persistence**: `saveDraft` writes the actual line items to `BillLineItem` rows (one per row) and sets
  `Bill.amount` = sum of line items — replacing the previous single synthetic line item.

Non-goals: the extra Ramp per-item fields (GL account, category, department, class, billable), quantity
/ unit-price breakdown (price is the line total), and reconciliation warnings.

## Capabilities

### New Capabilities
- `bill-line-items`: Viewing, editing, adding, and removing bill line items in the create-bill form,
  with a live invoice total.

### Modified Capabilities
- `bill-draft-persistence`: `saveDraft` persists the reviewed line-items array (one `BillLineItem` per
  row) with `Bill.amount` = their sum, instead of a single derived line item.

## Impact

- **Code**: `stores/bill-draft.ts` (hold `lineItems`, add/update/remove actions, derived total),
  `app/bill/new/_components/bill-form.tsx` (line-items UI + Add button + total),
  `app/bill/new/actions.ts` (persist the array).
- **No schema/migration changes** — uses existing `BillLineItem` (description, quantity, unitPrice,
  total, type, order). For MVP: quantity = 1, unitPrice = total = the row price, type = EXPENSE.
- **No new dependencies.**
