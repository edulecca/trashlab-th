# bill-create-page Specification

## Purpose
TBD - created by syncing change add-bill-new-page. Update Purpose after archive.
## Requirements
### Requirement: Full-screen bill creation route

The system SHALL provide a route at `/bill/new` that renders a full-screen,
three-column layout for creating a bill from a captured invoice. This layout
SHALL replace the `/main` backoffice chrome (no global navigation sidebar) and
apply only to routes under `/bill`.

#### Scenario: Navigating from the bills list

- **WHEN** the user activates the **New Bill** button on the `/main` bills page
- **THEN** the app navigates to `/bill/new`
- **AND** the page renders full-screen without the `/main` navigation sidebar

#### Scenario: Three-column structure

- **WHEN** the `/bill/new` page is displayed on a wide viewport
- **THEN** it shows three regions: a bill list rail on the left, a bill detail
  form in the center, and a document preview on the right

#### Scenario: Leaving the creation screen

- **WHEN** the user activates the back / "Bill Pay" control in the screen header
- **THEN** the app navigates back to `/main`

### Requirement: Bill list rail

The left column SHALL present a searchable list of bills that lets the user move
between drafts without leaving the creation screen.

#### Scenario: Listing bills

- **WHEN** the `/bill/new` page loads
- **THEN** the left rail lists bills, each showing the vendor name, amount, and
  due date

#### Scenario: Searching bills

- **WHEN** the user types a query into the "Search bills" field
- **THEN** the list filters to bills whose vendor or invoice matches the query

### Requirement: OCR-detected bill form

The center column SHALL present the bill's fields — vendor, invoice number,
invoice date, due date, amount, and description — as editable inputs, with a
header showing the bill status (`Draft`) and a title derived from the vendor and
invoice number. Fields start empty when the screen is first opened and are
populated by OCR (or manual entry) as the bill is reviewed; each field group
shows a completeness indicator.

#### Scenario: Empty initial state

- **WHEN** the creation screen is first opened
- **THEN** all detected fields are empty, the title reads a neutral default, and
  each field group shows a "Missing info" indicator

#### Scenario: Completeness indicator

- **WHEN** a field group has all its required fields filled
- **THEN** that group shows a "Complete" indicator

#### Scenario: Editing a field

- **WHEN** the user edits a field
- **THEN** the field reflects the new value and the form tracks it as changed

#### Scenario: No unrelated tabs

- **WHEN** the center column is displayed
- **THEN** it does NOT render Overview or Activity tabs

### Requirement: Document preview

The right column SHALL render a real preview of the source invoice PDF. The user
SHALL be able to attach a PDF via an "Agregar PDF" action; once attached it is
rendered in a real PDF viewer.

#### Scenario: Empty state with add action

- **WHEN** the creation screen is first opened and no document is attached
- **THEN** the right column shows an empty state with an "Agregar PDF" action
  instead of a broken preview

#### Scenario: Attaching and rendering a PDF

- **WHEN** the user attaches a PDF via the "Agregar PDF" action
- **THEN** the right column renders that PDF in a real PDF viewer

#### Scenario: Replacing the document

- **WHEN** a PDF is attached
- **THEN** the user can replace it with a different PDF

### Requirement: Save draft and create actions

The screen SHALL provide a footer with **Save draft** and **Create bill**
actions for the in-progress bill.

#### Scenario: Actions available

- **WHEN** the creation screen is displayed
- **THEN** a footer presents a **Save draft** action and a **Create bill**
  action

### Requirement: Navigate to a bill from the rail
The new-bill rail SHALL let a user open a bill by clicking its list item, routing by status.

#### Scenario: Click a non-draft rail item
- **WHEN** a user clicks a rail item whose bill is not a draft
- **THEN** the app navigates to `/bill/view/<id>`

#### Scenario: Click a draft rail item
- **WHEN** a user clicks a rail item whose bill is a draft
- **THEN** the app navigates to `/bill/new`

### Requirement: Reusable read-only form sections
The bill form section components SHALL support a disabled/read-only mode driven by props, so the view screen can reuse them without duplicating layout.

#### Scenario: Rendered in read-only mode
- **WHEN** a form section is rendered with its disabled/read-only prop set
- **THEN** its inputs are non-editable and the add/remove line-item controls are hidden

#### Scenario: Rendered in editable mode
- **WHEN** a form section is rendered without the disabled/read-only prop (the create flow)
- **THEN** its inputs are editable and bound to the draft store as before

