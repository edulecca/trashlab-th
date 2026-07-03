## 1. Persistence: upsert + id

- [x] 1.1 In `stores/bill-draft.ts`, track `billId: string | null` and `status` (+ a `setPersisted(id, status)` action); include `billId` in the saved payload
- [x] 1.2 In `app/bill/new/actions.ts`, make `saveDraft` upsert — update the existing `Bill` (fields + replace line items) when `billId` is present, else create — and return `{ id }`
- [x] 1.3 Auto-persist after extraction: on `loadExtraction` success in the create flow, call `saveDraft` once and store the returned id (extraction endpoint stays unchanged)

## 2. Server actions: approve + pay

- [x] 2.1 Add `approveBill(id)` to `actions.ts`: set `status = APPROVED` (guard: from `DRAFT`), `revalidatePath` view + `/main`
- [x] 2.2 Add `payBill(id, methodSlug)`: guard `status === APPROVED`; look up `PaymentMethod` by slug; create `Payment` (amount = bill total, `status = PAID`, `processedAt = now`, linked method); set `Bill.status = PAID`; `revalidatePath`
- [x] 2.3 Handle a missing/unknown slug with a clear thrown error

## 3. Approve in the create flow

- [x] 3.1 Change the create-flow footer primary button to **Approve** (keep "Save draft"); on click: `saveDraft` (upsert) then `approveBill(id)`, then route to `/bill/view/[id]`
- [x] 3.2 Saving/approving states + error feedback (reuse the footer's inline status / a toast)

## 4. Payment method + Pay (view screen)

- [x] 4.1 Create a `PaymentMethodSelect` (two options: ACH (deposit) → `ach`, By Check → `check`) with local selection state
- [x] 4.2 In `bill/view/[id]`, when `status === APPROVED`, render a **Payment method** section + a **Pay** button that calls `payBill(id, slug)`; on success the view reflects `PAID`
- [x] 4.3 `PAID` shows a completed state (no Approve/Pay); `DRAFT`/`APPROVED`/`PAID` action areas branch on status

## 5. Verification

- [x] 5.1 `tsc --noEmit` clean (app + ui-system)
- [x] 5.2 Extract a sample PDF → a `DRAFT` row is auto-created (one row, no duplicates on re-save); appears in the Drafts tab
- [x] 5.3 Approve → bill becomes `APPROVED` and routes to the view; the Payment method section shows
- [x] 5.4 Pay by ACH and by Check (separately) → a `Payment` row is created with the right method and the bill becomes `PAID`; verify in the DB
- [x] 5.5 Pay is rejected when the bill is not `APPROVED`
