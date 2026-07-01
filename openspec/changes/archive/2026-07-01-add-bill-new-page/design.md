## Context

`/main` renders through `AppShell` (a nav sidebar + content region). The bills
list already exists (`/main`, `bills-table.tsx`) with a **New Bill** button that
currently does nothing. Data models (`Bill`, `Vendor`, `BillLineItem`) exist via
Prisma; `Bill` already has `fileUrl`, `number`, `invoiceDate`, `dueDate`,
`amount`, `currency`, `memo`, and a `source` of `OCR`. There is no real OCR
pipeline and no create/persist path yet.

Next.js is the pinned version in this repo — App Router, per the `AGENTS.md`
warning we consult `node_modules/next/dist/docs/` rather than training-data
assumptions for route/layout APIs.

## Goals / Non-Goals

**Goals:**
- A `/bill/new` full-screen, three-column creation screen that does NOT inherit
  the `/main` sidebar chrome.
- Keep the layout scoped to `/bill/**` so it can be reused by future bill routes
  (e.g. `/bill/[id]`).
- Rename `AppShell` → `BackofficeLayout` for clarity, with zero behavior change.
- Compose existing `ui-system` primitives; realistic demo data over breadth.

**Non-Goals:**
- Real OCR extraction (fields are seeded/stubbed as if detected).
- Persisting a created bill / wiring Save draft & Create bill to the database
  (actions are stubbed in this cut).
- Overview / Activity tabs, approvals, payment scheduling.
- Real PDF rendering pipeline beyond an `<iframe>`/`<embed>` of `fileUrl` with a
  placeholder fallback.

## Decisions

**1. Route-level layout, not a shared component.**
Place a `layout.tsx` under `apps/app/app/bill/` that renders the full-screen
three-column chrome. `/bill/new/page.tsx` supplies the content. Because `/bill`
is a sibling of `/main` (not nested under it), it does NOT inherit `MainLayout`,
so the sidebar is naturally absent — no conditional-chrome hacks.
*Alternative considered:* a route group `(billpay)` or a prop on `AppShell` to
hide the nav. Rejected — sibling routes give the isolation for free and keep the
two layouts independent, matching "applies only to that route."

**2. Rename `AppShell` → `BackofficeLayout`.**
Rename the file `app-shell.tsx` → `backoffice-layout.tsx`, export
`BackofficeLayout`, and update the sole importer `app/main/layout.tsx`. Pure
rename; internal `Brand`/`NavLinks` helpers unchanged. Keeps the "backoffice
chrome" concept distinct from the new full-screen bill layout.

**3. Three columns via a flex/grid split with independent scroll.**
Left rail fixed-ish width (~`w-80`), right preview a comfortable share, center
flexes. Each column scrolls independently; the screen itself is `h-svh` with a
sticky header (back → `/main`, status) and a sticky footer (Save draft / Create
bill), mirroring the Ramp reference.

**4. Server component page + small client islands.**
`page.tsx` is a server component that reads bills via Prisma for the left rail
(reusing the `/main` query shape). The search box, the editable OCR form, and
any interactive preview controls are client components in `_components/`. Submit
handlers are stubbed (no-op / `console` / toast) pending the persistence spec.

**5. Demo "detected" data.**
The center form is seeded from a representative bill (vendor, invoice #, dates,
amount, description) to demonstrate the OCR-review UX without a real extractor,
consistent with the repo's "realistic demo data" guidance.

## Risks / Trade-offs

- **Stubbed actions look real but don't persist** → clearly label as demo in the
  README / component comments; wire real create in a follow-up change.
- **PDF preview via `fileUrl` may be empty in seed data** → placeholder/empty
  state is a first-class scenario, not an afterthought.
- **Rename touches an imported symbol** → low risk (single importer); grep to
  confirm no other references before archiving.
- **Layout duplication** (backoffice vs. bill chrome) → acceptable; the two
  screens have genuinely different shells, and forcing shared abstraction now
  would be premature.

## Open Questions

- Should the left rail reuse the exact bill grouping from Ramp (Missing info /
  Ready for review), or a flat list for the MVP? (Leaning flat + search now.)
- Where will create/save-draft persistence live — server action vs. route
  handler? Deferred to the follow-up persistence change.
