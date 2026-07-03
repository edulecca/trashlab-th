## Why

The `/main` bills table has status tabs but no way to search, or to control which columns show and in what order. Ramp's list has a toolbar for exactly this. We also want a single place that owns "how the table is currently viewed" so search, column visibility, and (later) filters all read from one source instead of being scattered across components.

## What Changes

- **Toolbar above the table**: a large borderless **Search** input on the left; on the right a cluster of icon buttons — **Columns** (functional) and **Options ▾** (functional), with filter / calendar / export rendered as **disabled visual placeholders** (they belong to a later filters change).
- **Search** filters the visible rows by text across vendor and invoice number.
- **Columns menu** (the table icon): a popover listing every column with a checkbox (show/hide) and a drag handle to **reorder**. The first column (Vendor/owner) is always visible and locked.
- **Options ▾**: **Reset filters** (clears the search) and **Reset view** (columns back to default visibility + order). No "Save as new view".
- **A Zustand view store** (`stores/bills-view.ts`, in-memory) is the single source of truth for the table view: `search`, `columnVisibility`, `columnOrder`, plus `resetView()` / `resetFilters()`. The table consumes it.
- **Two new reusable primitives** in `ui-system`: `DropdownMenu` and `Popover` (via shadcn).

Out of scope (later change): the `+ Add filter` builder, filter count badge, calendar and export actions, and any saved/named views or persistence.

## Capabilities

### New Capabilities
- `bills-table-view`: a client-side view store + toolbar (search, column visibility/order, reset) that drives how the bills table is displayed.

### Modified Capabilities
- `bills-list-tabs`: the bills list gains a toolbar (search + column control + options) above the status tabs' table; the table renders columns per the view store.

## Impact

- **New deps**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (column drag-reorder).
- **ui-system**: add `dropdown-menu` and `popover` (shadcn), export them.
- **New files**: `stores/bills-view.ts`; `components/bills-toolbar.tsx`, `components/bills-search.tsx`, `components/columns-menu.tsx`, `components/options-menu.tsx` (names indicative).
- **Changed**: `app/main/_components/bills-view.tsx` (renders the toolbar) and `bills-table.tsx` (consumes `columnVisibility`, `columnOrder`, and a global text filter from the store). Existing status tabs (`?tab=`) and `VendorElementRow` are kept.
