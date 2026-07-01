## 1. Rename AppShell → BackofficeLayout

- [x] 1.1 Rename `apps/app/components/app-shell.tsx` → `backoffice-layout.tsx` and export `BackofficeLayout` (rename the component; keep `Brand`/`NavLinks` internals unchanged)
- [x] 1.2 Update `apps/app/app/main/layout.tsx` to import and render `BackofficeLayout`
- [x] 1.3 Grep the repo for `AppShell` / `app-shell` to confirm no stale references remain

## 2. Bill route full-screen layout

- [x] 2.1 Create `apps/app/app/bill/layout.tsx` — full-screen (`h-svh`) chrome with a sticky top bar (back link → `/main`) and a `flex-1` region the page fills. Note: with Next's single-`children` layout model, the three columns and the center's sticky footer live in the page (see 3.x/6.1); the layout owns the shared full-screen, no-sidebar frame.
- [x] 2.2 Verify `/bill/**` does NOT render the `/main` sidebar (sibling route, no shared layout)

## 3. New bill page + data

- [x] 3.1 Create `apps/app/app/bill/new/page.tsx` as a server component that queries bills (vendor, amount, dueDate) via Prisma, reusing the `/main` query shape (data ready for the left rail, which lands later from `ui-system`)
- [x] 3.2 Seed the center form from a representative "OCR-detected" bill (vendor, invoice #, invoice date, due date, amount, description)

## 4. Center — OCR-detected form

- [x] 4.1 Build `_components/bill-form.tsx` client component with pre-filled editable fields: vendor, invoice #, invoice date, due date, amount, description
- [x] 4.2 Header shows `Draft` status + title derived from vendor + invoice number; NO Overview/Activity tabs
- [x] 4.3 Track edited fields in local form state (stubbed — no persistence)

## 5. Right — document preview

- [x] 5.1 Build `_components/document-preview.tsx` that renders the invoice from `fileUrl` (iframe/embed) with an empty/placeholder state when `fileUrl` is missing

## 6. Actions + entry point

- [x] 6.1 Add sticky footer **Save draft** and **Create bill** actions (stubbed handlers with a visible affordance; no DB write yet)
- [x] 6.2 Point the **New Bill** button on `apps/app/app/main/page.tsx` to `/bill/new`

## 7. Verify

- [x] 7.1 Run the app: `/main` renders unchanged with the sidebar; **New Bill** navigates to `/bill/new`
- [x] 7.2 `/bill/new` shows three columns full-screen (no sidebar); fields are editable; preview shows content or placeholder; footer actions present; back returns to `/main`
- [x] 7.3 Typecheck / lint pass
