## MODIFIED Requirements

### Requirement: Save a reviewed bill draft

The system SHALL persist a reviewed bill draft as a `Bill` row with `status = DRAFT`. Saving SHALL **upsert**: when the draft already has a persisted bill id it updates that row (fields + line items) rather than creating a new one, and it SHALL return the bill id. A successful AI extraction SHALL auto-persist the DRAFT (the extraction endpoint itself does not write to the database — the create flow saves the draft after extraction). The bill SHALL be linked to a vendor and attributed to a user, and SHALL record the reviewed form's currency, dates, invoice number, description, and **tax**. The reviewed **line items** SHALL be persisted as one `BillLineItem` row per non-empty line item. `Bill.tax` SHALL equal the reviewed tax (defaulting to `0`), and `Bill.amount` SHALL equal the sum of the line items' prices **plus** `tax`.

#### Scenario: Draft saved

- **WHEN** the user saves a draft with reviewed form fields
- **THEN** a `Bill` row is created with `status = DRAFT`, linked to a `Vendor`, with the form's fields (including `tax`) persisted, and its id is returned

#### Scenario: Re-saving updates the same draft

- **WHEN** the draft already has a persisted bill id and is saved again
- **THEN** that same `Bill` row is updated (no duplicate bill is created)

#### Scenario: Extraction auto-persists a draft

- **WHEN** an AI extraction returns successfully in the create flow
- **THEN** a `DRAFT` bill is persisted and its id is held for subsequent edits and approval

#### Scenario: Vendor found or created

- **WHEN** the reviewed vendor name matches an existing `Vendor`
- **THEN** the bill links to that vendor; otherwise a new `Vendor` is created from the reviewed name/email

#### Scenario: Line items persisted

- **WHEN** the reviewed draft has line items
- **THEN** one `BillLineItem` row is created per non-empty item (description + price), and `Bill.amount` equals their sum plus `Bill.tax`

#### Scenario: Tax persisted and folded into amount

- **WHEN** the reviewed draft has a subtotal of 1000 and tax of 100
- **THEN** `Bill.tax` is `100` and `Bill.amount` is `1100`
