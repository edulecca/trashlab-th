## Why

Today a user can list bills but has no way to create one. Ramp's core Bill Pay
loop starts when an invoice is captured by OCR and a human reviews the detected
fields before committing the bill. We need a dedicated, focused screen for that
review-and-create step — one that puts the extracted data and the source
document side by side so the user can verify at a glance.

## What Changes

- Add a new full-screen route `/bill/new` for creating a bill from a captured
  invoice, reached from the existing **New Bill** button on `/main`.
- The route renders its **own full-screen layout** (three columns) that
  **replaces** the `/main` app shell — no global nav sidebar on this screen.
  Scoped to `/bill/**` for now.
  - **Left**: a compact, searchable list of bills (context / navigation between
    drafts).
  - **Center**: the bill form pre-filled with fields "detected by OCR"
    (vendor, invoice #, invoice date, due date, amount, description), each
    reviewable/editable, with a header showing status (`Draft`) and title, and a
    footer with **Save draft** / **Create bill** actions.
  - **Right**: a PDF preview of the source invoice.
- Omit the Overview / Activity tabs from the Ramp reference (out of scope).
- **Rename** the `AppShell` component to a clearer name (`BackofficeLayout`) so
  it reads as the backoffice chrome for the `/main` section, distinct from the
  new full-screen `/bill` layout. (No behavior change — rename + import updates.)

## Capabilities

### New Capabilities
- `bill-create-page`: The `/bill/new` full-screen, three-column bill creation
  experience — layout, the OCR-detected field form, the bill list rail, the PDF
  preview, and the Save draft / Create bill actions.

### Modified Capabilities
<!-- None. AppShell → BackofficeLayout is an implementation-level rename with no
     spec-level behavior change; the existing /main behavior is unchanged. -->

## Impact

- **New route**: `apps/app/app/bill/new/page.tsx` plus a `apps/app/app/bill/layout.tsx`
  (or route-group layout) that provides the full-screen three-column chrome,
  and `_components/` for the list rail, OCR form, and PDF preview.
- **New button behavior**: the **New Bill** button on `apps/app/app/main/page.tsx`
  links to `/bill/new`.
- **Rename**: `apps/app/components/app-shell.tsx` (`AppShell` →
  `BackofficeLayout`) and its importer `apps/app/app/main/layout.tsx`.
- **Data**: reads `Bill`/`Vendor` via Prisma for the list rail (reuses existing
  models; no schema change). Create/Save-draft persistence and real OCR are
  deferred — the initial cut wires the layout with realistic demo data and a
  stubbed submit.
- **UI system**: composes existing `ui-system` primitives (Button, Badge,
  inputs); may surface the need for form-input primitives, tracked in tasks.
