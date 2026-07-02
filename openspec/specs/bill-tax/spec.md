# bill-tax Specification

## Purpose
TBD - created by archiving change add-bill-tax. Update Purpose after archive.
## Requirements
### Requirement: Bill records tax as a dedicated field

A `Bill` SHALL carry a `tax` monetary value distinct from its line items. `Bill.amount` SHALL remain the grand total the payer owes, and the invariant `amount = (Σ line item prices) + tax` SHALL hold. Subtotal SHALL be derived (`amount − tax`) and MUST NOT be stored. `tax` SHALL default to `0` and MUST NOT be negative.

#### Scenario: Tax stored apart from items

- **WHEN** a bill has a subtotal of 1000 and 100 of tax
- **THEN** `Bill.tax` is `100`, no line item represents the tax, and `Bill.amount` is `1100`

#### Scenario: No tax on the invoice

- **WHEN** an invoice states no tax
- **THEN** `Bill.tax` is `0` and `Bill.amount` equals the sum of the line items

### Requirement: Extraction collapses all tax lines into the tax field

The AI extraction SHALL exclude every tax-like line (VAT, GST, sales tax, surcharge, etc.) from `lineItems` and return the **sum** of all such lines as a single `bill.tax`. Non-tax charges (shipping, discounts, fees for goods/services) SHALL remain as line items. When no tax is stated, `bill.tax` SHALL be `null` or `0`.

#### Scenario: Multiple tax lines summed

- **WHEN** an invoice lists "VAT $80" and "City surcharge $20" plus product lines
- **THEN** `bill.tax` is `100` and neither tax line appears in `lineItems`

#### Scenario: Shipping is not tax

- **WHEN** an invoice lists a "Shipping $15" line
- **THEN** shipping remains a line item and is not added to `bill.tax`

