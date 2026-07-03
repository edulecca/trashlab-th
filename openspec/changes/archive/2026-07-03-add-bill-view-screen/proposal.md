## Why

Today a bill can only be created (`/bill/new`); there is no way to open an existing, already-processed bill. Users clicking a non-draft bill in the main table or the rail have nowhere to go. We need a read-only screen that shows a finalized bill — its details and source PDF — reusing the create-bill layout so the two views feel like one product.

## What Changes

- Add a read-only screen at **`/bill/view/[id]`** that loads a bill from the DB by id and renders the same form layout as `/bill/new`, but fully **disabled** and prefilled from DB data.
- The right column shows the bill's stored **PDF**; when the bill has no file, it shows the message **"No se cargó pdf"** (no upload/extract controls in view mode).
- Make the `/bill/new` **form section components support a read-only/disabled mode** so the view screen reuses them instead of duplicating layout.
- **Navigation wiring**: clicking a bill in the main table or the rail navigates to it — a **non-draft** bill opens `/bill/view/[id]`; a **draft** bill keeps opening `/bill/new`.
- Add a route to **serve the stored PDF** (`Bill.file` is `Bytes?`) so the view's PDF panel and any preview can load it by bill id.
- Add a **single-bill data loader** (bill + vendor + line items) shared by the page.

No database schema changes (`Bill.file` already exists).

## Capabilities

### New Capabilities
- `bill-view-page`: A read-only bill view at `/bill/view/[id]` — disabled, DB-prefilled form; PDF panel with an empty-state message; and the endpoint that serves a bill's stored PDF by id.

### Modified Capabilities
- `bills-table-view`: table rows become navigable — clicking a row opens the bill (non-draft → view page, draft → create page).
- `bill-create-page`: the rail's bill items become navigable to a bill; the form section components gain a read-only/disabled mode so they can be reused by the view page.

## Impact

- **New:** `app/bill/view/[id]/page.tsx`; `app/api/bills/[id]/file/route.ts` (serve PDF); a single-bill loader in `lib/`.
- **Modified:** form section components (`vendor-section`, `details-section`, `line-items-editor`, `totals-summary`, `bill-form`) to accept `disabled`; bills-table cells + `bills-rail` to add navigation links.
- **Data mapping:** `BillLineItem` has `quantity/unitPrice/total`; the read-only form (like create) shows `{ description, amount }`, mapping `amount = total`. Decided in design.
- **No** Prisma schema/migration changes.
