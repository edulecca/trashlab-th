# billpay-data-model Specification

## Purpose
TBD - created by archiving change add-billpay-data-model. Update Purpose after archive.
## Requirements
### Requirement: Core AP entities

The system SHALL persist the Accounts Payable domain as six related entities: `User`, `Vendor`, `Bill`, `BillLineItem`, `PaymentMethod`, and `Payment`. Every entity SHALL have a stable primary key and `createdAt`/`updatedAt` timestamps, except `BillLineItem` and `PaymentMethod`, which are child/lookup records.

#### Scenario: Entities are queryable

- **WHEN** the Prisma Client is generated from the schema
- **THEN** typed models exist for `User`, `Vendor`, `Bill`, `BillLineItem`, `PaymentMethod`, and `Payment`, each readable and writable through the client

#### Scenario: Timestamps are populated

- **WHEN** a `Bill` (or `User`, `Vendor`, `Payment`) is created
- **THEN** `createdAt` is set to the creation time and `updatedAt` tracks the last modification

### Requirement: Bill belongs to a vendor and an uploader

A `Bill` SHALL reference exactly one `Vendor` (`vendorId`) and exactly one uploading `User` (`uploadedById`), and MAY reference an approving `User` (`approvedById`, nullable). A `Bill` SHALL carry an invoice `number`, an `invoiceDate`, a `dueDate`, an optional `fileUrl` (the source invoice document), and an optional `memo`.

#### Scenario: Bill links to its vendor

- **WHEN** a bill is read with its relations
- **THEN** the bill exposes its `Vendor` and the `User` who uploaded it

#### Scenario: Approver is optional

- **WHEN** a bill is still in `DRAFT` or `NEEDS_REVIEW`
- **THEN** `approvedById` MAY be null, and it is set only once the bill is approved

### Requirement: Bill lifecycle is an enum state machine

A `Bill` SHALL have a `status` drawn from the enum `DRAFT`, `NEEDS_REVIEW`, `APPROVED`, `SCHEDULED`, `PAID`, `FAILED`. The intended forward path is `DRAFT → NEEDS_REVIEW → APPROVED → SCHEDULED → PAID`, with `FAILED` reachable from `SCHEDULED` when a payment attempt fails.

#### Scenario: Valid status values

- **WHEN** a bill is persisted
- **THEN** its `status` is one of the six enum values and defaults to `DRAFT` on creation when not otherwise specified

#### Scenario: Failure returns a bill to actionable state

- **WHEN** a scheduled bill's payment fails
- **THEN** the bill's `status` becomes `FAILED` so it can be retried

### Requirement: Overdue is derived, never stored

The system SHALL NOT persist an `OVERDUE` status. A bill is considered overdue when `dueDate < now` AND `status` is not `PAID`. This derivation is computed at read time.

#### Scenario: Unpaid past-due bill reads as overdue

- **WHEN** a bill's `dueDate` is in the past and its `status` is not `PAID`
- **THEN** the bill is reported as overdue by derivation, without any stored `OVERDUE` value

#### Scenario: Paid bill is never overdue

- **WHEN** a bill's `status` is `PAID`
- **THEN** the bill is never reported as overdue regardless of `dueDate`

### Requirement: Ingestion source is recorded

A `Bill` SHALL record how it entered the system via a `source` enum: `MANUAL`, `OCR`, `EMAIL`, `CSV`. `source` is distinct from `uploadedById`: `source` describes the ingestion method, `uploadedById` describes the responsible user.

#### Scenario: Source captured on creation

- **WHEN** a bill is created from any entry point
- **THEN** its `source` reflects the ingestion method (e.g. `CSV` for spreadsheet upload, `EMAIL` for AP email forwarding) and defaults to `MANUAL`

### Requirement: Bill line items

A `Bill` SHALL have zero or more `BillLineItem` records. Each line item SHALL have a `description`, a `quantity`, a `unitPrice`, a computed `total`, a `type` enum (`EXPENSE` or `ITEM`), an optional `category`, and an integer `order` for stable display sequencing. Deleting a bill SHALL cascade to its line items.

#### Scenario: Line items ordered stably

- **WHEN** a bill's line items are read
- **THEN** they can be returned in ascending `order`

#### Scenario: Line item type distinguishes expense vs item

- **WHEN** a line item is created
- **THEN** its `type` is either `EXPENSE` or `ITEM`

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

### Requirement: Bill to Payment is one-to-many with its own status

A `Bill` SHALL have zero or more `Payment` records (`Bill 1:N Payment`). Each `Payment` SHALL have an `amount` (`Decimal`), a `paymentMethodId` referencing a `PaymentMethod`, an optional `scheduledDate`, an optional `processedAt`, and a `status` enum: `SCHEDULED`, `PROCESSING`, `PAID`, `FAILED`. A normal bill has zero or one payment; multiple payments support failed-then-retry and partial payments.

#### Scenario: Retry creates a second payment

- **WHEN** a bill's first payment `status` is `FAILED`
- **THEN** a second `Payment` can be created for the same bill without removing the failed one, preserving the attempt history

#### Scenario: Payment references a method

- **WHEN** a payment is created
- **THEN** it references exactly one `PaymentMethod`

### Requirement: Payment methods are a lookup catalog

`PaymentMethod` SHALL be a catalog of payment types, each with a unique `slug` (e.g. `ach`, `check`, `wire`, `card`) and a human `description`. Payments reference these methods rather than duplicating method data.

#### Scenario: Method identified by slug

- **WHEN** a payment method is referenced
- **THEN** it is identifiable by a unique `slug`

