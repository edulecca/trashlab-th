## Why

Scanning or re-uploading the same invoice creates a second bill — today nothing flags it, so the same payable can slip through twice. We want to allow the re-upload (people do it by accident and shouldn't be blocked) but make the duplicate obvious: in the create screen, in the bills list, and give the user a one-click way to delete the redundant draft.

## What Changes

- Detect **duplicate bills**: two bills are duplicates when they share the same **invoice number + vendor**. The **original** is the earliest by `createdAt`; every later match is flagged as "duplicate of <original number>". Derived, never stored. A missing/placeholder invoice number is never treated as a duplicate.
- Re-ingesting the same bill is **allowed** (not blocked) — it's created as a draft like any other, then flagged.
- **New-bill screen**: show an **error message above the form** when the open draft duplicates an existing bill (e.g. "This bill duplicates NOT-1090").
- **Bills list**: show a **"Duplicate" pill** on rows that are duplicates.
- **Delete a draft** (soft): when a bill is a DRAFT, add a **"Delete Bill"** action on the **left** of the create footer. It marks the bill with a new **`DELETED`** status (tombstone) that is **excluded from every bill fetch** — nothing is hard-deleted.

## Capabilities

### New Capabilities
- `duplicate-bill-detection`: The rule for identifying duplicate bills (invoice number + vendor, original = earliest `createdAt`) and the derived "duplicate of <number>" reference exposed to the UI.
- `bill-delete`: Soft-delete a DRAFT bill — mark it `DELETED` (a new status) so it disappears from every fetch.

### Modified Capabilities
- `bill-create-page`: an error banner above the form when the draft is a duplicate; a "Delete Bill" action in the footer for drafts.
- `bills-table-view`: a "Duplicate" pill on duplicate rows.

## Impact

- **UI-only detection:** duplicates are computed **client-side from the bills already loaded** — no new DB reads, no persistence. A small `lib/` helper derives the flags.
- **New:** the duplicate helper; a "Delete Bill" footer control + `deleteBill` server action (soft delete → `DELETED`); a duplicate error banner on `/bill/new`; a `visibleBillsWhere` fetch filter that hides `DELETED`.
- **Modified:** `BillRow` gains a derived `duplicateOf: string | null`; `form-footer` renders Delete Bill for drafts; a duplicate pill in the table/rail; every bill fetch (`/api/bills`, new-bill + view rails, `getBillView`) excludes `DELETED`.
- **Schema:** one **additive** migration — a `DELETED` value on the `BillStatus` enum. No data migration; existing rows unaffected.
