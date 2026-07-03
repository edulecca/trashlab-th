## ADDED Requirements

### Requirement: Duplicate warning on the create screen
The create screen SHALL show an error message above the form when the open (persisted) draft duplicates an existing bill.

#### Scenario: Draft duplicates an existing bill
- **WHEN** the open draft has the same invoice number + vendor as an earlier bill
- **THEN** an error banner above the form states that the bill duplicates the earlier bill, naming its invoice number

#### Scenario: Not a duplicate
- **WHEN** the open draft has no earlier bill with the same invoice number + vendor
- **THEN** no duplicate banner is shown

### Requirement: Delete action for drafts
The create footer SHALL offer a "Delete Bill" action, on the left, when the open bill is a persisted draft.

#### Scenario: Delete control visible for a saved draft
- **WHEN** the create screen shows a persisted `DRAFT` bill
- **THEN** a "Delete Bill" control appears on the left of the footer, opposite Save draft / Confirm

#### Scenario: No delete control before a bill exists
- **WHEN** the create screen shows a new bill that has not been saved yet
- **THEN** no "Delete Bill" control is shown
