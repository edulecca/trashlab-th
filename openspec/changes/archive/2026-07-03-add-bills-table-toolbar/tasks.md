## 1. Dependencies & primitives

- [x] 1.1 Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` in `apps/app`
- [x] 1.2 Add `dropdown-menu` and `popover` to `ui-system` via shadcn; fix any `@/` imports to relative; export both from `index.ts`

## 2. View store

- [x] 2.1 Create a shared `COLUMNS` config (key, label, default visible, default order; mark `vendor` as locked) used by the store and the menu
- [x] 2.2 Create `apps/app/stores/bills-view.ts` (`useBillsView`): `search`, `columnVisibility`, `columnOrder`; actions `setSearch`, `toggleColumn`, `setColumnOrder`, `resetFilters`, `resetView`

## 3. Search

- [x] 3.1 Create `apps/app/components/bills-search.tsx`: borderless, `h-20` (80px), magnifier icon, "Search…" placeholder; binds to `useBillsView().search`

## 4. Columns menu

- [x] 4.1 Create `apps/app/components/columns-menu.tsx`: table-icon `Popover` listing columns; each row = `Checkbox` (visibility) + label + drag handle
- [x] 4.2 Wire drag-reorder with `@dnd-kit/sortable` → `setColumnOrder`; `vendor` row is locked (no toggle, not draggable, stays first)

## 5. Options menu

- [x] 5.1 Create `apps/app/components/options-menu.tsx`: "Options ▾" `DropdownMenu` with **Reset filters** (`resetFilters`) and **Reset view** (`resetView`)

## 6. Toolbar shell

- [x] 6.1 Create `apps/app/components/bills-toolbar.tsx`: Search left; right cluster = filter/calendar/columns/export/Options, with filter+calendar+export as disabled placeholders
- [x] 6.2 Render the toolbar in `bills-view.tsx` above the table

## 7. Wire the table to the store (derive outside, DataTable untouched)

- [x] 7.1 In `bills-table.tsx`, derive the `columns` prop from `COLUMNS` filtered by `columnVisibility` and sorted by `columnOrder` (Vendor pinned first); each column def's `id` matches its `COLUMNS` key
- [x] 7.2 Derive the `data` prop by filtering the fetched rows with a simple search match over vendor + invoice number (from `useBillsView().search`)
- [x] 7.3 Count the summary line ("N bills · overdue") from the filtered rows
- [x] 7.4 Leave `DataTable` generic and its `rowSelection` internal (no store coupling; lifts to a store only when bulk actions land)

## 8. Verification

- [x] 8.1 `tsc --noEmit` clean (app + ui-system)
- [x] 8.2 Search narrows rows (vendor / invoice #) and composes with the active tab; clearing restores
- [x] 8.3 Columns: hide/show reflects in the table; drag reorders; Vendor stays locked & first
- [x] 8.4 Options: Reset filters clears search; Reset view restores default visibility + order
- [x] 8.5 Filter/calendar/export render disabled; `/main` still 200 with tabs intact
