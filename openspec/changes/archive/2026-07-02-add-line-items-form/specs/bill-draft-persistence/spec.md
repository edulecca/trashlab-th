## MODIFIED Requirements

### Requirement: Save a reviewed bill draft

The system SHALL persist a reviewed bill draft as a `Bill` row with `status = DRAFT` when the user
saves. The bill SHALL be linked to a vendor and attributed to a user, and SHALL record the reviewed
form's currency, dates, invoice number, and description. The reviewed **line items** SHALL be persisted
as one `BillLineItem` row per non-empty line item, and `Bill.amount` SHALL equal the sum of the line
items' prices.

#### Scenario: Draft saved

- **WHEN** the user clicks "Save draft" with reviewed form fields
- **THEN** a `Bill` row is created with `status = DRAFT`, linked to a `Vendor`, with the form's fields persisted

#### Scenario: Vendor found or created

- **WHEN** the reviewed vendor name matches an existing `Vendor`
- **THEN** the bill links to that vendor; otherwise a new `Vendor` is created from the reviewed name/email

#### Scenario: Line items persisted

- **WHEN** the reviewed draft has line items
- **THEN** one `BillLineItem` row is created per non-empty item (description + price), and `Bill.amount` equals their sum
