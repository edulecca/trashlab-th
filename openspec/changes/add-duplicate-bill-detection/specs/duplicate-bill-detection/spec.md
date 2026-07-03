## ADDED Requirements

### Requirement: Duplicate identification
The system SHALL identify a bill as a duplicate when another bill shares the same invoice number and vendor, treating the earliest-created bill as the original.

#### Scenario: Second upload of the same invoice
- **WHEN** a bill has the same trimmed invoice number and same vendor as an earlier-created bill
- **THEN** it is flagged as a duplicate, and its reference is the earlier bill's invoice number

#### Scenario: The original is not flagged
- **WHEN** a set of bills shares an invoice number + vendor
- **THEN** the one with the earliest `createdAt` (ties broken deterministically) is the original and is NOT flagged; every later one is

#### Scenario: Matches across statuses
- **WHEN** a new draft repeats the invoice number + vendor of a bill in any status (e.g. APPROVED, PAID)
- **THEN** the draft is still flagged as a duplicate of that earlier bill

### Requirement: Blank invoice numbers are never duplicates
The system SHALL exclude bills without a real invoice number from duplicate detection.

#### Scenario: Two blank drafts, same vendor
- **WHEN** two bills have an empty or placeholder invoice number and the same vendor
- **THEN** neither is flagged as a duplicate of the other

### Requirement: Duplicate reference exposed to the UI
The bill row shape consumed by the lists SHALL carry a derived duplicate reference (the original bill's invoice number, or none).

#### Scenario: Row annotation
- **WHEN** the bills list is built for the table or the rail
- **THEN** each duplicate row exposes the original invoice number it duplicates, and non-duplicate rows expose none
