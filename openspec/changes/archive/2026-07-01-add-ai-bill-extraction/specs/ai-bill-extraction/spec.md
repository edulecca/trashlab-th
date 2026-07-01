## ADDED Requirements

### Requirement: PDF upload validation

The system SHALL validate an uploaded invoice file before invoking the AI model, and SHALL reject
invalid files with a typed JSON error `{ ok: false, error: { code, message } }` without making an AI
call. Validation MUST enforce: the file is a PDF (verified by `%PDF` magic bytes, not extension
alone), size ≤ 500KB, page count ≤ 5, and the PDF is not encrypted / password-protected.

#### Scenario: Non-PDF file rejected

- **WHEN** a user uploads a file whose bytes do not begin with the `%PDF` header
- **THEN** the system responds with `{ ok: false, error: { code: "INVALID_TYPE", message } }` and does not call the AI model

#### Scenario: Oversized file rejected

- **WHEN** a user uploads a PDF larger than 500KB
- **THEN** the system responds with `{ ok: false, error: { code: "TOO_LARGE", message } }` and does not call the AI model

#### Scenario: Too many pages rejected

- **WHEN** a user uploads a PDF with more than 5 pages
- **THEN** the system responds with `{ ok: false, error: { code: "TOO_MANY_PAGES", message } }` and does not call the AI model

#### Scenario: Encrypted PDF rejected

- **WHEN** a user uploads a password-protected / encrypted PDF
- **THEN** the system responds with `{ ok: false, error: { code: "ENCRYPTED", message } }` and does not call the AI model

### Requirement: Document classification

The system SHALL determine whether the uploaded document is a bill/invoice via a dedicated classifier
agent that runs before extraction. When the document is not a bill, the system SHALL return a typed JSON
error and SHALL NOT run the extraction agent.

#### Scenario: Non-invoice document

- **WHEN** a valid PDF is uploaded but the model determines it is not an invoice/bill
- **THEN** the system responds with `{ ok: false, error: { code: "NOT_A_BILL", message } }`

#### Scenario: Invoice document

- **WHEN** a valid PDF is uploaded and the model determines it is an invoice/bill
- **THEN** the system proceeds to return the extracted structured data

### Requirement: Structured bill extraction

The system SHALL extract invoice data into a schema-validated JSON object using a dedicated extraction
agent with a constrained output schema (Vercel AI SDK `generateObject` + Zod). The extracted object MUST
include:
vendor (`name`, `email`), and bill (`invoiceNumber`, `invoiceDate`, `dueDate`, `currency`,
`description`, and `lineItems[]` where each item has `description` and `amount`). Fields not present in
the document MUST be returned as `null` rather than fabricated. Dates MUST be normalized to ISO
`YYYY-MM-DD`. Amounts MUST be numeric.

#### Scenario: Successful extraction

- **WHEN** a valid invoice PDF is processed
- **THEN** the system responds with `{ ok: true, data }` where `data` conforms to the extraction schema

#### Scenario: Missing field is null, not invented

- **WHEN** the invoice does not state a due date
- **THEN** the returned `data.bill.dueDate` is `null` (the model does not fabricate a value)

#### Scenario: Dates and amounts normalized

- **WHEN** an invoice lists a date as "March 3, 2026" and an amount as "$1,240.00"
- **THEN** the returned `dueDate`/`invoiceDate` are ISO `YYYY-MM-DD` strings and the amount is the number `1240.00`

### Requirement: Extraction result populates the create-bill form

The system SHALL load a successful extraction result into a client-side draft store, from which the
create-bill form inputs are pre-filled for the user to review and edit. Extraction SHALL NOT write to
the database; persistence occurs only when the user submits the reviewed form via the existing
create-bill flow.

#### Scenario: Form pre-filled from extraction

- **WHEN** extraction returns `{ ok: true, data }`
- **THEN** the create-bill form fields (vendor name/email, invoice number, dates, line items) are populated from `data` and remain editable

#### Scenario: No database write during extraction

- **WHEN** a PDF is uploaded and extracted
- **THEN** no `Bill` or `Vendor` row is created until the user submits the form

#### Scenario: Extraction failure surfaces to the user

- **WHEN** extraction returns `{ ok: false, error }`
- **THEN** the UI shows `error.message` and the form is not pre-filled, leaving manual entry available
