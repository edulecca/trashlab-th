## Context

The create flow (`/bill/new`) edits an in-memory draft store and persists via `saveDraft` (currently on "Save draft"; the primary "Create bill" button is a stub). A separate read-only screen (`/bill/view/[id]`) reuses the form sections in disabled mode and redirects `DRAFT` bills back to the create flow. The data model already has `Bill.status` (`DRAFT`/`REVIEWED`/`APPROVED`/`PAID`/`FAILED`), a `Payment` model, and seeded `PaymentMethod` rows (`ach`, `check`, …). What's missing is the wiring to transition a bill and to record a payment.

## Goals / Non-Goals

**Goals:**
- Advance a bill `DRAFT → APPROVED → PAID` from the UI, status-driven.
- Approve in the create flow; pick a payment method + Pay on the view screen.
- Record a real `Payment` on Pay; no schema changes.

**Non-Goals:**
- A Review step / `REVIEWED` transition (kept in the enum, unused here).
- Real payment processing, scheduling, or async states (`SCHEDULED`/`PROCESSING`).
- Approvals/permissions/multi-approver, `FAILED` handling, refunds.

## Decisions

**D1 — Split the actions by screen, matching the existing routes.**
`Approve` lives in the create flow (`/bill/new`) because that's where a `DRAFT` is edited. `Payment method` + `Pay` live on the view screen (`/bill/view/[id]`) because that's where a persisted, non-draft bill is shown. After Approve, the create flow routes to `/bill/view/[id]`. This reuses the redirect the view page already does (`DRAFT → /bill/new`) as the inverse.

**D2 — `saveDraft` upserts and returns the id; the draft store tracks it.**
`saveDraft(fd)` becomes an upsert: if the store holds a persisted bill id, update that row (fields + line items), else create. It returns `{ id }`. The draft store gains `billId` and `status`. This lets the same row be created on OCR, edited while `DRAFT`, then approved — without duplicate rows.

**D3 — Auto-persist the DRAFT after a successful extraction (flagged decision #1).**
On extraction success the client calls `saveDraft` once to create the `DRAFT` row and stash its id in the store. `/api/extract` stays pure (no DB write) — the write is a separate client-initiated action, so the extraction spec is unchanged. Manual entry persists on the first Save. Trade-off: an abandoned scan leaves a stray DRAFT; acceptable (it's a real draft, visible/removable in the Drafts tab).

**D4 — `approveBill(id)` and `payBill(id, methodSlug)` are server actions.**
- `approveBill(id)`: sets `status = APPROVED`, `revalidatePath` the view + list. (Fields are already saved via `saveDraft` immediately before.)
- `payBill(id, methodSlug)`: look up the `PaymentMethod` by slug (`ach`/`check`); create a `Payment` (`amount` = bill total, `status = PAID`, `processedAt = now`, linked method); set `Bill.status = PAID`; `revalidatePath`. Guard: only from `APPROVED`.

**D5 — Payment method selector is a two-option control mapped to seeded slugs.**
`ACH (deposit)` → `ach`, `By Check` → `check`. A small `PaymentMethodSelect` (radio-style) drives local state on the view screen; `Pay` passes the chosen slug to `payBill`.

**D6 — Status-driven UI, one screen per phase.**
`DRAFT` → editable create form + **Approve** (and Save draft). `APPROVED` → read-mostly view + **Payment method** + **Pay**. `PAID` → done state, no actions. The view screen already renders a status badge; it branches the action area on `bill.status`.

## Risks / Trade-offs

- [Approve without prior save loses edits] → the create flow calls `saveDraft` (upsert) and then `approveBill` in sequence, so the approved row reflects the latest form.
- [Stray DRAFT rows from abandoned scans] → they are legitimate drafts in the Drafts tab; a future change can add discard. Logged as a known trade-off.
- [Paying twice / wrong state] → `payBill` guards on `status === APPROVED`; the Pay UI only renders for `APPROVED`.
- [`PaymentMethod` slug missing] → `payBill` throws a clear error if the slug isn't seeded; the two slugs (`ach`, `check`) are in the seed.

## Migration Plan

No DB migration. Ship server actions + UI together. Rollback = revert code (no data shape change; any created `Payment`/status stays valid).
