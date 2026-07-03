## MODIFIED Requirements

### Requirement: Coverage of every bill status

The seed SHALL include at least one `Bill` in each lifecycle status (`DRAFT`, `NEEDS_REVIEW`, `REVIEWED`, `APPROVED`, `SCHEDULED`, `PAID`, `FAILED`) and SHALL include at least one unpaid bill whose `dueDate` is in the past so the derived-overdue path is demonstrable.

#### Scenario: All statuses present

- **WHEN** the seeded bills are listed
- **THEN** each of the seven lifecycle statuses is represented by at least one bill

#### Scenario: Overdue case is demonstrable

- **WHEN** the seeded data is inspected
- **THEN** at least one non-`PAID` bill has a past `dueDate`, so it derives as overdue
