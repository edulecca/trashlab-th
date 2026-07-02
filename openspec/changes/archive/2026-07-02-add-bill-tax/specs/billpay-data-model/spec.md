## MODIFIED Requirements

### Requirement: Money uses Decimal with explicit currency

All monetary fields (`Bill.amount`, `Bill.tax`, `BillLineItem.unitPrice`, `BillLineItem.total`, `Payment.amount`) SHALL use Prisma `Decimal` and MUST NOT use floating-point types. A `Bill` SHALL carry a `currency` code (e.g. `USD`). A `Bill` SHALL carry a `tax` Decimal that defaults to `0`; `Bill.amount` is the grand total and satisfies `amount = (Σ BillLineItem.total) + tax`.

#### Scenario: No floating point money

- **WHEN** any monetary value is stored
- **THEN** it is a `Decimal`, preserving exact cents with no floating-point rounding error

#### Scenario: Currency travels with the bill

- **WHEN** a bill is read
- **THEN** its `amount` is interpretable in the bill's `currency`

#### Scenario: Tax is a Decimal on the bill

- **WHEN** a bill is stored
- **THEN** `tax` is a `Decimal(12,2)` defaulting to `0`, and `amount` equals the line-item total plus `tax`
