## Why

The bill lifecycle (`DRAFT → APPROVED → PAID`) exists in the data model and the status tabs, but there is no way to actually *move* a bill through it from the UI. The create flow ends at a stubbed "Create bill" button, and the read-only view screen shows a bill's status without any action to advance it. This change closes the loop: a user reviews a draft, approves it, picks how to pay, and pays — the core payables workflow.

## What Changes

- **DRAFT is a real, persisted, editable bill.** A successful OCR extraction auto-persists a `DRAFT` bill and the create flow then edits that same row (staying `DRAFT`); manual entry persists on Save. So drafts appear in the Drafts tab and are resumable.
- **Approve** (create flow, `/bill/new`): the primary footer button reads **Approve** and transitions `DRAFT → APPROVED` (saving current form fields), then routes to the bill view. *(REVIEWED is skipped here; it stays in the enum for the tab.)*
- **Payment method + Pay** (bill view, `/bill/view/[id]`, when `APPROVED`): a new **Payment method** section with two options — **ACH (deposit)** and **By Check** — and a **Pay** button below it.
- **Pay** creates a `Payment` (chosen method, amount = bill total, status `PAID`, `processedAt` now) and sets the bill to `PAID`, completing the lifecycle. `PAID` bills show a done state (no actions).
- New server actions: `approveBill(id)` and `payBill(id, methodSlug)`; `saveDraft` upserts (create or update an existing draft) and returns the id.

## Open decisions (flagged for review)

1. **When the DRAFT is persisted** — proposed: **auto on OCR success** (client calls `saveDraft` after extraction; the `/api/extract` endpoint stays pure). Alternative: persist only on Approve (no intermediate DRAFT row). Chosen the first so drafts are resumable and show in the Drafts tab.
2. **Review step** — proposed: **skip** (`DRAFT → APPROVED` directly). Alternative: add a Review step (`DRAFT → REVIEWED → APPROVED`).

## Capabilities

### New Capabilities
- `bill-lifecycle-actions`: UI + server actions to advance a bill `DRAFT → APPROVED → PAID`, including payment-method selection and payment creation.

### Modified Capabilities
- `bill-draft-persistence`: `saveDraft` upserts a draft (create or update by id) and returns the id; a successful extraction auto-persists the DRAFT.

## Impact

- **No schema changes** — reuses `Bill.status`, `Payment`, and the seeded `PaymentMethod` rows (`ach`, `check`).
- **Server actions**: `app/bill/new/actions.ts` — add `approveBill`, `payBill`; make `saveDraft` upsert + return id.
- **UI**: create-flow footer (Approve), a `PaymentMethodSelect` + Pay section on the bill view for `APPROVED`, a `PAID` done state. `stores/bill-draft.ts` tracks the persisted bill id/status.
- Existing tax / line-items / toolbar / view-page work is preserved.
