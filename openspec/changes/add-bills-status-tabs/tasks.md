## 1. Data model

- [x] 1.1 Add `REVIEWED` to `enum BillStatus` in `prisma/schema.prisma` (between `NEEDS_REVIEW` and `APPROVED`)
- [x] 1.2 `prisma migrate dev --name bill_status_reviewed` + `prisma generate`
- [x] 1.3 Seed one `REVIEWED` demo bill (keep one bill per status; give it a sensible vendor/amount/dates)

## 2. TanStack Query setup

- [x] 2.1 Install `@tanstack/react-query` in `apps/app`
- [x] 2.2 Add a `QueryProvider` client component holding a stable `QueryClient` (`useState(() => new QueryClient())`, `staleTime` ~30s)
- [x] 2.3 Mount `QueryProvider` around `children` in `app/layout.tsx`

## 3. Bills API + row source of truth

- [x] 3.1 Extract the `BillRow` type + the bill→row mapping into a shared module the API and page both import
- [x] 3.2 Create `app/api/bills/route.ts` (`GET`, `runtime=nodejs`, `dynamic=force-dynamic`): read repeatable `status` params, validate against the enum (ignore unknowns), query `where: { status: { in } }` (or all), map to rows with server-derived `overdue`, return JSON

## 4. useBills hook

- [x] 4.1 Create `apps/app/hooks/use-bills.ts`: `useBills({ status }?)` where `status?: BillStatus | BillStatus[]`
- [x] 4.2 Normalize `status` to a sorted array; `queryKey: ["bills", sorted]`; `queryFn` builds `?status=` and fetches `/api/bills`, returns `BillRow[]`

## 5. Tabs + client table

- [x] 5.1 Define the tab config: Overview → `[]`, Draft → `[DRAFT, NEEDS_REVIEW]`, For Approval → `[REVIEWED]`, For Payment → `[APPROVED]`
- [x] 5.2 Make `BillsTable` (or a wrapper) a client island: `ui-system` `Tabs` above it; active tab derived from `?tab=` (fallback Overview); clicking a tab `router.replace`s `?tab=`
- [x] 5.3 Drive the table body from `useBills(activeTab.status)`; loading + empty states
- [x] 5.4 Add a `REVIEWED` entry to the status badge/label map ("Reviewed"); keep the `VendorElementRow` cell and `overdue` badge
- [x] 5.5 Update `app/main/page.tsx` to render the client island (drop the direct Prisma query, or keep it only to prefetch/hydrate Overview — optional)

## 6. Verification

- [x] 6.1 `tsc --noEmit` clean (app)
- [x] 6.2 `GET /api/bills`, `?status=REVIEWED`, and `?status=DRAFT&status=NEEDS_REVIEW` return the right filtered sets (curl)
- [x] 6.3 In the UI: each tab shows the expected bills; `?tab=` persists across reload; unknown `?tab=` falls back to Overview
- [x] 6.4 Re-selecting a fresh tab does not refire the request (React Query cache)
