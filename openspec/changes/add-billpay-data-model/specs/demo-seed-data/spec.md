## ADDED Requirements

### Requirement: Reproducible seed script

The system SHALL provide a seed script, runnable via a single command, that populates the database with realistic Accounts Payable demo data. Running the seed on an empty database SHALL succeed without manual steps.

#### Scenario: Seed runs from empty

- **WHEN** the seed command is run against a freshly migrated, empty database
- **THEN** the script completes successfully and the database contains demo data

#### Scenario: Seed is repeatable

- **WHEN** the seed command is run
- **THEN** it resets/upserts to a known state so repeated runs produce the same representative dataset rather than accumulating duplicates

### Requirement: Coverage of every bill status

The seed SHALL include at least one `Bill` in each lifecycle status (`DRAFT`, `NEEDS_REVIEW`, `APPROVED`, `SCHEDULED`, `PAID`, `FAILED`) and SHALL include at least one unpaid bill whose `dueDate` is in the past so the derived-overdue path is demonstrable.

#### Scenario: All statuses present

- **WHEN** the seeded bills are listed
- **THEN** each of the six lifecycle statuses is represented by at least one bill

#### Scenario: Overdue case is demonstrable

- **WHEN** the seeded data is inspected
- **THEN** at least one non-`PAID` bill has a past `dueDate`, so it derives as overdue

### Requirement: Representative related data

The seed SHALL include multiple `User`s, multiple `Vendor`s (with names, and where realistic an email/image), the `PaymentMethod` catalog (`ach`, `check`, `wire`, `card`), `BillLineItem`s on bills (mixing `EXPENSE` and `ITEM` types), and `Payment`s covering `SCHEDULED`, `PROCESSING`, `PAID`, and `FAILED` — including at least one bill with a `FAILED` payment followed by a retry.

#### Scenario: Line items sum to the bill

- **WHEN** a seeded bill has line items
- **THEN** the line item totals reconcile with the bill `amount`

#### Scenario: Retry history exists

- **WHEN** the seeded payments are inspected
- **THEN** at least one bill has both a `FAILED` payment and a later payment, demonstrating the 1:N retry model
