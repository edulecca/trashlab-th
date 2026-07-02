## 1. Draft store

- [x] 1.1 Change the store's shape to hold `lineItems: { description: string; amount: string }[]` and drop the single `amount` field
- [x] 1.2 Map extraction into `lineItems` (real items, not a summed amount); default a manual draft to one empty row
- [x] 1.3 Add actions: `setLineItem(index, key, value)`, `addLineItem()`, `removeLineItem(index)`
- [x] 1.4 Expose a derived invoice total (sum of `parseFloat(amount)`, NaN → 0)

## 2. Form UI

- [x] 2.1 Replace the Amount input with the line-items list: one row = description input + price input + remove control
- [x] 2.2 Add the "Add line item" button below the list (appends an empty row)
- [x] 2.3 Render the read-only "Invoice total" from the derived sum; keep "details complete" logic consistent
- [x] 2.4 Pre-fill rows from the store on extraction

## 3. Persistence

- [x] 3.1 Update `saveDraft` to accept the line items array (serialize via FormData / JSON)
- [x] 3.2 Create one `BillLineItem` per non-empty row (quantity 1, unitPrice = total = price, type EXPENSE, order = index); set `Bill.amount` = sum

## 4. Verification

- [x] 4.1 `tsc --noEmit` clean
- [x] 4.2 Extract the sample PDF → rows populate; add/remove/edit updates the total live
- [x] 4.3 Save draft → verify `BillLineItem` rows and `Bill.amount` = sum in the DB
