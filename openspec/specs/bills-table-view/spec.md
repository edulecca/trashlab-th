# bills-table-view Specification

## Purpose
TBD - created by archiving change add-bills-table-toolbar. Update Purpose after archive.
## Requirements
### Requirement: A view store owns the table's search and columns

A client-side, in-memory view store SHALL be the single source of truth for how the bills table is displayed, holding the search text, per-column visibility, and column order. The table SHALL render according to this store; components MUST NOT keep their own copies of view state.

#### Scenario: Store drives the table

- **WHEN** the store's column visibility or order changes
- **THEN** the table re-renders with those columns shown and in that order

#### Scenario: View state is not persisted

- **WHEN** the page is reloaded
- **THEN** the view returns to its defaults (the store is in-memory, not persisted)

### Requirement: Search filters the visible rows

A borderless search input SHALL filter the table rows by matching the query against the vendor and invoice number. Clearing the search SHALL restore all rows (within the active status tab).

#### Scenario: Text narrows the list

- **WHEN** the user types text that matches a vendor or invoice number
- **THEN** only rows matching that text remain visible

#### Scenario: Empty search shows all

- **WHEN** the search is empty
- **THEN** all rows for the active tab are shown

### Requirement: Columns can be shown, hidden, and reordered

A columns menu SHALL list the table's columns, each with a visibility toggle and a drag handle for reordering. Toggling a column SHALL show or hide it; dragging SHALL change its position. The first column (Vendor/owner) SHALL always be visible and SHALL NOT be reorderable.

#### Scenario: Hide a column

- **WHEN** the user unchecks a column in the menu
- **THEN** that column is removed from the table

#### Scenario: Reorder a column

- **WHEN** the user drags a column above another
- **THEN** the table columns reflect the new order

#### Scenario: Vendor column is locked

- **WHEN** the columns menu is open
- **THEN** the Vendor/owner column has no hide toggle and cannot be dragged; it stays first

### Requirement: Options can reset filters and view

An Options menu SHALL offer **Reset filters** (clear the search) and **Reset view** (restore default column visibility and order). It SHALL NOT offer saving a named view.

#### Scenario: Reset filters

- **WHEN** the user chooses Reset filters
- **THEN** the search is cleared and all rows for the active tab are shown

#### Scenario: Reset view

- **WHEN** the user chooses Reset view
- **THEN** every column returns to its default visibility and the default order

### Requirement: Not-yet-built controls are inert placeholders

Toolbar controls that belong to the later filters work (filter, calendar, export) SHALL be rendered as disabled placeholders that convey no behavior, so the toolbar matches the reference without implying unbuilt functionality.

#### Scenario: Placeholder is disabled

- **WHEN** the toolbar is shown
- **THEN** the filter, calendar, and export controls are visibly disabled and do nothing when clicked

### Requirement: Navigate to a bill from the table
The bills table SHALL let a user open a bill by clicking its row, routing by status.

#### Scenario: Click a non-draft bill row
- **WHEN** a user clicks a row whose bill is not a draft
- **THEN** the app navigates to `/bill/view/<id>`

#### Scenario: Click a draft bill row
- **WHEN** a user clicks a row whose bill is a draft
- **THEN** the app navigates to `/bill/new`

#### Scenario: Interacting with row controls does not navigate
- **WHEN** a user clicks the row's selection checkbox or its action control
- **THEN** that control performs its action and no navigation occurs

