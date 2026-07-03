## 1. Duplicate detection (client-side, no DB)

- [x] 1.1 Add `duplicateOf: string | null` to `BillRow` (defaults to `null` in `toBillRow`).
- [x] 1.2 Add a pure client helper `lib/duplicates.ts` `annotateDuplicates(rows)` that groups by trimmed `number` + `vendor`, skips blank/`"DRAFT"` numbers, sorts by upload time, and sets `duplicateOf` (original's number) on the non-originals. Also export a `findDuplicateNumber(rows, { number, vendor })` for the banner.
- [x] 1.3 Run `annotateDuplicates` in the client list components over the bills they already hold — the `/main` table (React Query result) and the `/bill/new` rail (its rows). No server/API changes.

## 2. Delete a draft (soft)

- [x] 2.1 Add a `DELETED` value to the `BillStatus` enum (additive migration) + regenerate the client.
- [x] 2.2 `deleteBill(id)` server action: guarded `updateMany` `DRAFT` → `DELETED`, `revalidatePath("/main")` + `revalidatePath("/bill/new")`.
- [x] 2.3 Add `visibleBillsWhere` and apply it to every fetch (`/api/bills`, new-bill + view rails); `getBillView` returns `null` for `DELETED`; drop `DELETED` from `BILL_STATUSES`; add unreachable `DELETED` entries to the status maps; keep `lib/bills` Prisma import type-only.
- [x] 2.4 Client delete handler in the create flow (toast + reset store + navigate to `/main`).

## 3. Create screen — banner + delete

- [x] 3.1 Share the rail's loaded bills with the create flow (pass `rows` down / lift to a shared client boundary); compute the duplicate reference client-side from the draft's `number` + vendor via `findDuplicateNumber`, reactively.
- [x] 3.2 Render an error banner above the form when a duplicate reference exists ("This bill duplicates <number>").
- [x] 3.3 Add a "Delete Bill" control to `form-footer` on the left, shown only when the store has a persisted `DRAFT` (`billId` + `billStatus === "DRAFT"`); on success reset the draft store and navigate to `/main`.

## 4. List pill

- [x] 4.1 Render a "Duplicate" `Badge` near the invoice number in the table (`columns.tsx` / invoice cell) when `row.duplicateOf` is set.
- [x] 4.2 Show the same pill in the rail item when `duplicateOf` is set (both render `BillRow`).

## 5. Verify

- [x] 5.1 Typecheck `apps/app` and `packages/ui-system`.
- [x] 5.2 Drive it: seed/create two bills with the same number + vendor → the later one shows the "Duplicate" pill in the list and the banner on `/bill/new`; deleting the draft removes it; the original is never flagged; two blank drafts are not flagged.
