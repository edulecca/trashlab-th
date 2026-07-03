## Context

`/main` is a server component: it queries Prisma, maps every bill to a `BillRow`, and renders `<BillsTable>`. There is no filtering and no client interactivity. The status enum has no "reviewed but not approved" state, so review and approval are one step. We want status tabs over the list, fetched client-side so switching is instant and cached.

## Goals / Non-Goals

**Goals:**
- Add `REVIEWED` to the lifecycle between `NEEDS_REVIEW` and `APPROVED`.
- Status tabs (Overview / Draft / For Approval / For Payment) that filter the list.
- Client-side, cached fetching via TanStack Query behind a `useBills({ status })` hook.
- A JSON endpoint the hook calls; active tab reflected in the URL.

**Non-Goals:**
- Actual review/approve/pay *actions* (state transitions) — this change is read + filter only. Buttons that move a bill between states are a follow-up.
- Server-side pagination / infinite scroll (the list is small).
- Per-row optimistic mutations.

## Decisions

**D1 — `REVIEWED` sits `NEEDS_REVIEW → REVIEWED → APPROVED`.**
The forward path becomes `DRAFT → NEEDS_REVIEW → REVIEWED → APPROVED → SCHEDULED → PAID`, `FAILED` from `SCHEDULED`. Additive enum value → migration is non-breaking for existing rows (none are `REVIEWED` yet); seed adds one so the "For Approval" tab has data.

**D2 — Client fetching via TanStack Query + a route handler (not server-component filtering).**
Alternative considered: keep `/main` a server component and drive the filter from a `?status=` search param (each tab = a navigation). Rejected because the user wants instant, cached tab switching without a full server round-trip per click. RQ caches each tab's result and dedupes refetches. Cost: `/main`'s table becomes a client island and we add one dependency.

**D3 — Endpoint contract: `GET /api/bills?status=A&status=B`.**
`status` is a **repeatable** query param (`searchParams.getAll("status")`); zero params = all bills. The handler validates each value against the enum (ignores unknowns), queries Prisma with `where: { status: { in } }`, computes `overdue` server-side (it needs "now"), and returns the same `BillRow[]` shape the table already consumes — so the row mapping lives in one place (server) and the client stays dumb. `runtime = "nodejs"`, `dynamic = "force-dynamic"` (Prisma, always fresh).

**D4 — `useBills({ status })` normalizes the filter into a stable query key.**
`status?: BillStatus | BillStatus[]` → normalize to a sorted array; `queryKey: ["bills", sortedStatuses]`; `queryFn` builds the `?status=` string and fetches `/api/bills`. Omitted/empty → `["bills", []]` and no `status` params (all). Sorting makes `[DRAFT, NEEDS_REVIEW]` and `[NEEDS_REVIEW, DRAFT]` share a cache entry.

**D5 — Tabs own the filter; the URL mirrors it via `?tab=`.**
Each tab maps to a fixed status set: Overview → `[]` (all), Draft → `[DRAFT, NEEDS_REVIEW]`, For Approval → `[REVIEWED]`, For Payment → `[APPROVED]`. The active tab key is read from / written to `?tab=` (`useSearchParams` + `router.replace`, no scroll). `ui-system` `Tabs` renders the control; `useBills(tab.status)` drives the table body. Unknown/missing `?tab=` falls back to Overview.

**D6 — `QueryProvider` is a client component holding a stable `QueryClient`.**
Created once via `useState(() => new QueryClient())` so it is not re-instantiated on re-render, and mounted in `RootLayout` around `children`. Sensible defaults (e.g. `staleTime` ~30s) to avoid refetch storms while tabbing.

## Risks / Trade-offs

- [SSR loading flash on first paint] The client island shows a loading state before the first fetch resolves. → Optional: server-prefetch the Overview query and pass `initialData` (or dehydrate/hydrate). MVP can ship with a lightweight skeleton and add prefetch later.
- [Enum migration ordering] Postgres enum add is safe, but the value's *position* is cosmetic only; app logic must not rely on enum ordinal. → We compare by name everywhere; ordering is documentation.
- [Two sources of truth (tab vs URL)] Tab state and `?tab=` could drift. → URL is the single source; the component derives the active tab from `searchParams`, and clicks only `router.replace` the param.
- [Row mapping duplicated] The `BillRow` shape is produced in the route handler now, not the page. → Export the mapping/type from one module the handler imports, so page and API agree.

## Migration Plan

1. Add `REVIEWED` to `enum BillStatus`; `prisma migrate dev` (additive) + `generate`.
2. Seed one `REVIEWED` bill (keep one bill per status).
3. Ship endpoint + hook + provider + client table together. Rollback = revert migration (enum value unused) + code.
