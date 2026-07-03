## ADDED Requirements

### Requirement: Duplicate pill in the list
The bills list SHALL show a "Duplicate" pill on rows that are duplicates.

#### Scenario: Duplicate row
- **WHEN** a bill row is a duplicate of an earlier bill
- **THEN** the row renders a "Duplicate" pill near its invoice number

#### Scenario: Original row
- **WHEN** a bill row is the original (or has no duplicate)
- **THEN** no "Duplicate" pill is shown
