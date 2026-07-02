## MODIFIED Requirements

### Requirement: Structured bill extraction

The system SHALL extract invoice data into a schema-validated JSON object using a dedicated extraction
agent with a constrained output schema (Vercel AI SDK `generateObject` + Zod). The extracted object MUST
include:
vendor (`name`, `email`), and bill (`invoiceNumber`, `invoiceDate`, `dueDate`, `currency`,
`description`, `tax`, and `lineItems[]` where each item has `description` and `amount`). Tax-like lines
(VAT, GST, sales tax, surcharge, etc.) MUST be excluded from `lineItems` and their amounts summed into a
single numeric `bill.tax`; when no tax is stated, `bill.tax` MUST be `null`. Other fields not present in
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

#### Scenario: Tax separated from line items

- **WHEN** an invoice lists product lines plus "VAT $80" and "Sales tax $20"
- **THEN** `data.bill.tax` is `100` and neither tax line appears in `data.bill.lineItems`
