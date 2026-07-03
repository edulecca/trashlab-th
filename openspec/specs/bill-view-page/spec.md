# bill-view-page Specification

## Purpose
TBD - created by archiving change add-bill-view-screen. Update Purpose after archive.
## Requirements
### Requirement: Read-only bill view screen
The system SHALL provide a screen at `/bill/view/[id]` that loads an existing bill from the database by id and renders it using the create-bill form layout, prefilled from the bill's data and fully non-editable.

#### Scenario: Open an existing bill
- **WHEN** a user opens `/bill/view/<id>` for a bill that exists
- **THEN** the screen loads the bill (vendor, details, line items, totals) and renders the same form layout as the create screen, prefilled with the bill's values

#### Scenario: All fields disabled
- **WHEN** the view screen renders
- **THEN** every form input SHALL be disabled (non-editable) and no save / create / edit / add / remove controls are shown

#### Scenario: Unknown bill id
- **WHEN** a user opens `/bill/view/<id>` for an id that does not exist
- **THEN** the screen SHALL render a not-found response

#### Scenario: Draft opened in the view
- **WHEN** a user opens `/bill/view/<id>` for a bill whose status is `DRAFT`
- **THEN** the screen SHALL redirect to `/bill/new`

### Requirement: Source PDF panel
The view screen SHALL show the bill's stored source PDF, or a message when no file is present.

#### Scenario: Bill has a stored PDF
- **WHEN** the viewed bill has a stored file
- **THEN** the right panel SHALL display the PDF inline

#### Scenario: Bill has no stored PDF
- **WHEN** the viewed bill has no stored file
- **THEN** the right panel SHALL display the message "No se cargó pdf" and no upload/extract controls

### Requirement: Serve a bill's stored PDF
The system SHALL expose an endpoint that returns a bill's stored PDF bytes by bill id.

#### Scenario: Bill with a file
- **WHEN** `GET /api/bills/<id>/file` is requested for a bill that has a stored file
- **THEN** it responds with the PDF bytes and `Content-Type: application/pdf`

#### Scenario: Bill without a file or unknown id
- **WHEN** `GET /api/bills/<id>/file` is requested for a bill with no file, or an unknown id
- **THEN** it responds with `404`

### Requirement: Line-item display mapping
The read-only form SHALL render line items as description + amount, where amount is the line item's total.

#### Scenario: Rendering line items
- **WHEN** the view renders a bill's line items
- **THEN** each line shows its `description` and an `amount` equal to the line item's `total`, formatted as currency

