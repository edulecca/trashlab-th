## 1. Data loading & PDF endpoint

- [x] 1.1 Add a single-bill loader in `lib/` that fetches a bill by id with `vendor` and `lineItems` (ordered), selecting display fields but **not** the `file` bytes, plus a cheap `hasFile: boolean` (file-not-null projection). Return `null` for unknown ids.
- [x] 1.2 Add a view shape (or reuse/extend `BillRow`) covering vendor, number, currency, invoiceDate, dueDate, tax, description, `hasFile`, and mapped line items `{ description, amount }` where `amount = total`.
- [x] 1.3 Add `GET /api/bills/[id]/file/route.ts`: return `Bill.file` bytes with `Content-Type: application/pdf` (inline), or `404` when null / unknown id.

## 2. Presentational form sections (decouple from store)

- [x] 2.1 Refactor `vendor-section` to take `form`, `disabled`, and an `onChange` callback via props instead of reading `useBillDraft` directly.
- [x] 2.2 Refactor `details-section` the same way (also receives `lineItems`/subtotal or a `complete` flag).
- [x] 2.3 Refactor `line-items-editor` to take `lineItems`, `disabled`, and item change/add/remove callbacks; hide add/remove controls when `disabled`.
- [x] 2.4 Refactor `totals-summary` to take `lineItems`, `tax`, `currency`, `disabled`, and a tax `onChange`.
- [x] 2.5 Update `bill-form.tsx` (create) to read `useBillDraft` and pass store values + setters (editable) into the sections.
- [x] 2.6 Typecheck the create flow and confirm `/bill/new` still works (edit, save draft, totals).

## 3. Read-only view screen

- [x] 3.1 Add `app/bill/view/[id]/page.tsx` (server): load the bill via 1.1; `notFound()` on null; `redirect("/bill/new")` when the bill's status is `DRAFT`.
- [x] 3.2 Add a `BillView` component composing `ResizableColumns` with the disabled sections in the center, prefilled from the loaded bill and no-op handlers.
- [x] 3.3 Add a read-only PDF panel: iframe `src="/api/bills/[id]/file#navpanes=0&view=FitH"` when `hasFile`, else the "No se cargó pdf" empty state (no upload/extract).
- [x] 3.4 Reuse the rail in the view: relocate `bills-rail` to a shared location and render it as the left column of both `/bill/new` and `/bill/view`.

## 4. Navigation wiring

- [x] 4.1 Add an optional `onRowClick?(row)` to the generic `DataTable`; clickable rows get `cursor-pointer`; the selection checkbox cell calls `stopPropagation`.
- [x] 4.2 In the bills table, pass an `onRowClick` that routes by status: `DRAFT` → `/bill/new`, else → `/bill/view/[id]`.
- [x] 4.3 In `bills-rail`, wrap each `ListItem` in a Next `<Link>` to the same status-based destination.

## 5. Verify

- [x] 5.1 Typecheck `apps/app` and `packages/ui-system`.
- [x] 5.2 Drive it: open a non-draft bill from the table and the rail → lands on `/bill/view/[id]`, fields disabled, values match DB; a bill with a PDF shows it, one without shows "No se cargó pdf"; a draft still opens `/bill/new`.
