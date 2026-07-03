## Context

`/bill/new` renders an editable create-bill flow: `ResizableColumns` with a left `bills-rail`, a center `BillForm` (section components bound to the `bill-draft` Zustand store), and a right `DocumentPreview` (upload + AI extract). There is no way to open an existing bill. `Bill.file` holds the source PDF as `Bytes?`. Bills are listed in the main table (`/main`) and the rail; neither is currently clickable.

## Goals / Non-Goals

**Goals:**
- A read-only `/bill/view/[id]` that reuses the create layout and form components, prefilled from the DB and fully disabled.
- Show the stored PDF; when absent, show "No se cargó pdf".
- Navigate to a bill from the table and the rail (non-draft → view, draft → create).
- No layout duplication between create and view.

**Non-Goals:**
- Editing, approving, paying, or any mutation from the view screen.
- Surfacing line-item `quantity`/`unitPrice` (the form shows description + amount, like create).
- Schema/migration changes.

## Decisions

### 1. Sections become presentational (props), not store-bound
Today the sections read `useBillDraft` directly. To reuse them read-only from DB data without polluting the singleton draft store (it belongs to the create flow), refactor the sections to receive their data and handlers as props: `form`, `lineItems`, `disabled`, and change callbacks. `BillForm` (create) wires store values + setters; `BillView` passes DB values, `disabled`, and no-op handlers.

- **Why over store-hydration:** hydrating the global `bill-draft` store on the view page would leak state into `/bill/new` and force fake `File`/extraction status. Props keep the sections pure and reusable.
- **Alternative considered:** a `readOnly` React context + store hydration — rejected (store contamination, still needs value plumbing).
- **Trade-off:** reverts the recent store-subscription in the sections; net simpler and the correct shape for reuse.

### 2. Route: dynamic segment `/bill/view/[id]`
Server component; loads the bill in the RSC. Chosen over `?id=` for a clean, shareable URL consistent with REST.

### 3. Serve the PDF via `GET /api/bills/[id]/file`
Returns `Bill.file` bytes with `Content-Type: application/pdf` (inline), or `404` when null. The view's PDF panel embeds it in an `<iframe src="/api/bills/[id]/file#navpanes=0&view=FitH">`, mirroring `DocumentPreview`.

- The page must decide the empty-state **without** shipping the (large) bytes to the RSC. The single-bill loader returns a cheap `hasFile: boolean` (via a `file IS NOT NULL` projection), and selects all display fields **except** `file`. Bytes stream only from the file route.

### 4. Read-only PDF panel is a new component
`DocumentPreview` is create-specific (file picker + `/api/extract`). The view uses a new, smaller read-only panel: iframe when `hasFile`, else the "No se cargó pdf" empty state. No upload/extract controls.

### 5. Navigation
- **Table:** add an optional `onRowClick?(row)` to the generic `DataTable`; clickable rows get `cursor-pointer`. The app handler routes by status (`DRAFT` → `/bill/new`, else → `/bill/view/[id]`). The selection checkbox cell calls `stopPropagation` so selecting a row doesn't navigate.
- **Rail:** wrap each `ListItem` in a Next `<Link>` to the same status-based destination.
- **Shared rail:** relocate `bills-rail` to a shared location so both `/bill/new` and `/bill/view` render it, keeping both screens navigable from one list.

### 6. Line-item mapping
The read-only form renders `{ description, amount }` with `amount = BillLineItem.total` (formatted string), consistent with the create form's simplified shape. `quantity`/`unitPrice`/`category` are not shown.

## Risks / Trade-offs

- **Row click vs. checkbox/action controls** → interactive cells (checkbox, "Pay Bill") `stopPropagation`; only non-interactive cells trigger navigation.
- **Section refactor touches the just-landed store-bound code** → mechanical; covered by tasks and a typecheck/build gate.
- **`hasFile` projection** → use a narrow query (or `$queryRaw`) to avoid loading blob bytes into the page render.
- **Draft opened via `/bill/view/[id]`** → the page redirects to `/bill/new` (a draft is edited in the create flow, not viewed read-only).

## Migration Plan

No data migration. Ship route + endpoint + section refactor together; a build/typecheck pass gates it. Rollback = revert the change (no persistent state introduced).

## Open Questions

- Does the view rail highlight the active bill? (Nice-to-have, not required.)

## Resolved

- A `DRAFT` id opened on `/bill/view/[id]` **redirects to `/bill/new`** (drafts are edited, not viewed).
