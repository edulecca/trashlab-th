## Why

The `/main` bills table is a static, server-rendered list of every bill. Reviewing payables is a workflow: you want to look at just the bills that need *your* next action (to review, to approve, to pay). Ramp does this with status tabs over the list. We also lack a status for "reviewed but not yet approved", so review and approval collapse into one step.

## What Changes

- **New status `REVIEWED`** in the `BillStatus` enum, positioned `NEEDS_REVIEW → REVIEWED → APPROVED` in the lifecycle. **BREAKING** (enum migration + a seeded demo bill in the new state).
- **Status-filter tabs** above the table (using `ui-system` `Tabs`):
  - **Overview** — all bills
  - **Draft** — `DRAFT` + `NEEDS_REVIEW`
  - **For Approval** — `REVIEWED`
  - **For Payment** — `APPROVED`
  - The active tab is synced to the URL (`?tab=`) for deep-linking.
- **Client-side data fetching with TanStack Query.** The table becomes a client island driven by a `useBills({ status })` hook; switching tabs refetches the filtered set (cached per status).
- **New data endpoint** `GET /api/bills?status=…` returning bill rows as JSON, filtered by one or more statuses.
- **New `hooks/` folder** with `useBills` (`status?: BillStatus | BillStatus[]`; omitted = all).

## Capabilities

### New Capabilities
- `bills-list-tabs`: the bills list is filterable by a status tab, fetched client-side per filter with URL-synced selection.
- `bills-api`: an HTTP endpoint that returns bills as JSON, filterable by status.

### Modified Capabilities
- `billpay-data-model`: the `BillStatus` enum gains `REVIEWED`; the lifecycle becomes `DRAFT → NEEDS_REVIEW → REVIEWED → APPROVED → SCHEDULED → PAID` (`FAILED` from `SCHEDULED`).
- `demo-seed-data`: the seed adds a `REVIEWED` bill so every tab has data.

## Impact

- **Prisma**: `BillStatus` enum + migration; `prisma/seed.ts` (one `REVIEWED` bill).
- **New deps**: `@tanstack/react-query`.
- **New files**: `app/api/bills/route.ts`, `hooks/use-bills.ts`, a `QueryProvider` client component (mounted in the app tree).
- **Changed**: `app/main/page.tsx` (renders the client island; optional RQ hydration), `app/main/_components/bills-table.tsx` (client, tabs + `useBills`). `VendorElementRow` cell and derived `overdue` logic are kept as-is.
- Status badge/label maps gain a `REVIEWED` entry.
