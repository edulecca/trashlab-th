## Context

Bills are created as drafts (manual or via scan → save). Vendors are deduped by name+email, so the same invoice re-scanned resolves to the same vendor. Bills are listed in `/main` (React Query over `/api/bills`) and the `/bill/new` rail; the create flow edits a draft via the client `bill-draft` store, persisting through `saveDraft`. `BillRow` is the shared row shape. There is no notion of duplicates today.

## Goals / Non-Goals

**Goals:**
- Identify duplicate bills by invoice number + vendor; the earliest by `createdAt` is the original.
- Surface duplicates without blocking creation: an error banner on `/bill/new`, a pill in the list.
- Let the user delete a DRAFT bill from the create footer.

**Non-Goals:**
- Blocking or auto-merging duplicate uploads.
- Fuzzy matching (amounts, dates, near-duplicate numbers) — exact number + vendor only.
- Deleting non-draft bills.
- Schema changes (duplicate status is derived at read time).

## Decisions

### 1. Duplicate rule (derived, not stored)
Two bills are duplicates when they share the same **trimmed invoice `number`** and **`vendorId`**. Within a match set (ordered by `createdAt`, then `id` for ties) the **first is the original**; every later bill is a duplicate whose reference is the original's `number`.

- **Qualifying number only:** empty numbers and the `"DRAFT"` placeholder (`saveDraft` uses it when the field is blank) are **excluded** — blank drafts are never duplicates of each other.
- Match set spans **all statuses**, not just drafts: a new draft that repeats an already-approved bill is still flagged.

### 2. Client-side annotation over the loaded set — no DB
Detection is a **pure UI derivation**: it never persists and never issues a new query. Add `duplicateOf: string | null` to `BillRow` and a client helper `annotateDuplicates(rows)` that groups the **already-loaded** rows by `number + vendor`, sorts by upload time, and sets `duplicateOf` on the non-originals. The list components run it over the bills they already hold (the `/main` table over its React Query result; the `/bill/new` rail over its rows).

- **Alternative considered:** deriving in `/api/bills` or a SQL window function. Rejected — the user wants this kept in the UI with no DB involvement.
- **Scope note:** detection covers the loaded set. Overview (all bills) is fully accurate; the `/bill/new` rail loads all bills unfiltered, so the create screen sees every original regardless of status. A status-filtered `/main` tab only dedupes within that tab — acceptable for the MVP.

### 3. New-bill error banner (from the loaded bills)
`/bill/new` already loads **all bills** for the rail. Share that set with the create flow so the banner is computed client-side: check the draft's current `number` + vendor against the loaded bills; if an earlier one matches, show a banner above the form ("This bill duplicates <number>"). No server action — same derivation as the list.

- **Trigger:** reactively as the draft's number/vendor change (after scan, or edits). A fresh bill with a blank number shows nothing.

### 4. Delete a draft — soft delete via a `DELETED` status
`deleteBill(id)` marks the bill `DELETED` (guarded to `DRAFT` via `updateMany`), instead of hard-deleting. A new `DELETED` value is added to the `BillStatus` enum (additive migration; existing rows untouched). Every bill fetch hides it through a shared `visibleBillsWhere` filter — `/api/bills`, the new-bill + view rails, and `getBillView` (which returns `null` → the view 404s / a draft would 308 to `/bill/new`). `BILL_STATUSES` (queryable set) drops `DELETED`.

- **Why soft over hard:** the row is kept (tombstone / auditability) but is invisible everywhere. No cascade deletes.
- The footer renders **"Delete Bill"** on the **left** when the store holds a persisted draft (`billId` set — the create screen only ever shows drafts). On success the client resets the draft store and navigates to `/main`.
- **Type note:** the enum grows, so status→display/category maps add an (unreachable) `DELETED` entry — DELETED never reaches the UI. `lib/bills` keeps its Prisma import **type-only** (it's used by client components), using the `"DELETED"` string literal, not the enum value.

### 5. List pill
Duplicate rows render a compact **"Duplicate"** `Badge` (warning/outline variant) next to the invoice number. The original bill shows nothing. Keeping the label short ("Duplicate", not "Duplicate of …") fits the row; the reference number lives in the create banner.

## Risks / Trade-offs

- **Blank-number drafts** → excluded from the rule, so two empty drafts never falsely flag. [Mitigation: qualifying-number filter.]
- **Detection is scoped to the loaded set** → a status-filtered `/main` tab won't see an original in another status. [Mitigation: Overview and the `/bill/new` rail load all bills; the primary flows are accurate.]
- **Delete is a hard delete** → guarded to DRAFT + user-initiated; cascades clean up children. [No recovery; acceptable for drafts.]
- **Banner only after save** → a just-scanned, unsaved duplicate isn't flagged until saved. [Acceptable; the scan already resolves the vendor and the user saves to proceed.]

## Migration Plan

No data migration. Ship the derivation + UI together; a typecheck/build gate covers it. Rollback = revert (no persisted state added).

## Open Questions

- Should the pill also appear in the `/bill/new` rail items, or only the `/main` table? (Default: both, since both render `BillRow`.)
- Badge variant for the pill — `warning` vs `outline`? (Default: `warning`, consistent with attention states.)
