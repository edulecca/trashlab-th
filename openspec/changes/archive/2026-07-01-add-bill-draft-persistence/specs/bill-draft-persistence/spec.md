## ADDED Requirements

### Requirement: Save a reviewed bill draft

The system SHALL persist a reviewed bill draft as a `Bill` row with `status = DRAFT` when the user
saves. The bill SHALL be linked to a vendor and attributed to a user, and SHALL record the reviewed
form's amount, currency, dates, invoice number, and description.

#### Scenario: Draft saved

- **WHEN** the user clicks "Save draft" with reviewed form fields
- **THEN** a `Bill` row is created with `status = DRAFT`, linked to a `Vendor`, with the form's fields persisted

#### Scenario: Vendor found or created

- **WHEN** the reviewed vendor name matches an existing `Vendor`
- **THEN** the bill links to that vendor; otherwise a new `Vendor` is created from the reviewed name/email

### Requirement: Persist the uploaded PDF blob on save

When the draft was created from an uploaded PDF, the system SHALL store the PDF bytes in `Bill.file` and
set `source = OCR`. The PDF SHALL be held only in the client draft store during review and written only
on save — never during extraction. A draft saved without an uploaded PDF SHALL have `file = null` and
`source = MANUAL`.

#### Scenario: PDF stored with the draft

- **WHEN** the user saves a draft that was pre-filled from an uploaded PDF
- **THEN** the created `Bill` has `source = OCR` and `Bill.file` contains the PDF bytes

#### Scenario: Manual draft has no blob

- **WHEN** the user saves a draft with no uploaded PDF
- **THEN** the created `Bill` has `source = MANUAL` and `Bill.file` is null

#### Scenario: No write before save

- **WHEN** a PDF is uploaded and extracted but the user has not saved
- **THEN** no `Bill` row exists and the PDF is held only in the client draft store
