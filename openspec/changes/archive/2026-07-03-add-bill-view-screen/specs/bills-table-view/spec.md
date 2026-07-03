## ADDED Requirements

### Requirement: Navigate to a bill from the table
The bills table SHALL let a user open a bill by clicking its row, routing by status.

#### Scenario: Click a non-draft bill row
- **WHEN** a user clicks a row whose bill is not a draft
- **THEN** the app navigates to `/bill/view/<id>`

#### Scenario: Click a draft bill row
- **WHEN** a user clicks a row whose bill is a draft
- **THEN** the app navigates to `/bill/new`

#### Scenario: Interacting with row controls does not navigate
- **WHEN** a user clicks the row's selection checkbox or its action control
- **THEN** that control performs its action and no navigation occurs
