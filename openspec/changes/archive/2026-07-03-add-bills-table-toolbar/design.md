## Context

`bills-view.tsx` renders status tabs over `BillsTable`, which builds a TanStack Table from a fixed `columns` array (select, vendor, number, dueDate, status, amount). There is no search and no column control. We want a toolbar and a store that owns the view. TanStack Table already models `columnVisibility`, `columnOrder`, and `globalFilter` as first-class state — the store just holds those and hands them to the table.

## Goals / Non-Goals

**Goals:**
- One in-memory store (`useBillsView`) owning search, column visibility, and column order.
- Toolbar: borderless 80px Search; Columns popover (checkbox + drag reorder, Vendor locked); Options menu (Reset filters, Reset view).
- Reusable `DropdownMenu` and `Popover` primitives in `ui-system`.

**Non-Goals:**
- Filters / `+ Add filter` / count badge / calendar / export actions (placeholders only, wired later).
- Saved or named views; any persistence (store resets on reload).
- Server-side search/sort; everything is client-side over the already-fetched rows.

## Decisions

**D1 — Zustand store `useBillsView` is the single source of view truth.**
Shape: `search: string`, `columnVisibility: Record<ColumnKey, boolean>`, `columnOrder: ColumnKey[]`, and actions `setSearch`, `toggleColumn`, `setColumnOrder`, `resetFilters` (search → ""), `resetView` (visibility + order → defaults). Column keys and their defaults live in one `COLUMNS` config the store and the menu share. In-memory (no `persist`).

**D2 — Derive the visible/ordered columns and filtered rows *outside* the table; keep the shared `DataTable` generic.**
Rejected the alternative of feeding TanStack Table's native controlled models (`columnVisibility` / `columnOrder` / `globalFilter`) because the reusable `DataTable` in `ui-system` owns its own `useReactTable` — threading controlled view state through it would couple a generic component to this one screen. Instead, the store holds plain data (`search`, `columnVisibility` map, `columnOrder` array) and `BillsTable` **derives** what it passes to the existing `DataTable`:
- columns = `COLUMNS` filtered by visibility and sorted by order (Vendor pinned first), passed as the `columns` prop
- rows = the fetched rows filtered by a simple search match over vendor + invoice number, passed as `data`
Dragging a column just rewrites `columnOrder` in the store; the derive re-runs. `DataTable` stays untouched and generic; its internal sorting keeps working (it lives on the column def). This is trivial at our scale (≈7 rows, ≈5 columns) and avoids all coupling.

**D2a — Row selection stays inside `DataTable`; it is a separate concern from the view store.**
"Single source of truth" is per-concern. `useBillsView` owns **view configuration** (search/columns) — what the toolbar drives. Row selection (the per-row checkbox) is transient **interaction** state and remains `DataTable`'s internal `rowSelection`. It is lifted into a store only when something outside the table needs to read it — i.e. when a bulk-actions bar ("N selected → Pay/Approve") lands in a later change. Lifting it now, with no consumer, would be premature (YAGNI).

**D3 — Column reorder with `@dnd-kit/sortable`; Vendor is locked.**
The Columns popover renders a `SortableContext` of rows (checkbox + label + drag handle). Dragging reorders `columnOrder` in the store. The first data column (`vendor`, "Vendor / owner") has no checkbox toggle (always visible) and is not draggable — it stays pinned. `select` is not listed (internal).

**D4 — New primitives via shadcn: `DropdownMenu` (Options) and `Popover` (Columns).**
Both are Radix-based and already fit the design system's shadcn setup. `Checkbox` already exists and is reused. The composed toolbar pieces (Search, ColumnsMenu, OptionsMenu, the toolbar shell) live in `apps/app/components` (app-specific), consuming the DS primitives.

**D5 — Search is borderless and 80px, in `apps/app/components`.**
A dedicated `BillsSearch` (not the framed DS `Input`) — magnifier icon, `h-20`, no border, transparent, large placeholder — matching the reference. It binds to `store.search`.

**D6 — Placeholder icons are visibly inert.**
Filter, calendar, and export render as `disabled` icon buttons (muted, `cursor-not-allowed`, `aria-disabled`) so the toolbar matches the reference without implying behavior. `+ Add filter` is omitted until the filters change.

## Risks / Trade-offs

- [Derived column order drops a column if incomplete] → Derive the ordered list from the full `COLUMNS` config (Vendor pinned first), never from a partial array; `resetView` restores the full default order.
- [Search hides rows the count/overdue summary counts] → The summary line counts the *filtered* rows (what the user sees), consistent with search.
- [Row selection can reference filtered-out rows] → Selection is `DataTable`-internal and keyed by row id; filtering the passed `data` naturally scopes "select all" to visible rows, which is the intended behavior.
- [Drag lib bundle cost] → `@dnd-kit` is tree-shakeable and only loaded by the columns menu (client island); acceptable for the interaction quality.
- [Store vs URL for view state] → View (search/columns) stays in the in-memory store; the status tab stays in the URL (`?tab=`). Two concerns, two homes — deliberately not merged.

## Migration Plan

1. Add `@dnd-kit/*`; add `dropdown-menu` + `popover` to `ui-system` and export.
2. Add `stores/bills-view.ts` with the `COLUMNS` config + defaults.
3. Build toolbar components; wire `BillsTable` to controlled visibility/order/globalFilter.
4. No DB/schema changes; rollback = remove components/store/deps.
