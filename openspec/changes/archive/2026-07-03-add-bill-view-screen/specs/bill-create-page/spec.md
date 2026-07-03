## ADDED Requirements

### Requirement: Navigate to a bill from the rail
The new-bill rail SHALL let a user open a bill by clicking its list item, routing by status.

#### Scenario: Click a non-draft rail item
- **WHEN** a user clicks a rail item whose bill is not a draft
- **THEN** the app navigates to `/bill/view/<id>`

#### Scenario: Click a draft rail item
- **WHEN** a user clicks a rail item whose bill is a draft
- **THEN** the app navigates to `/bill/new`

### Requirement: Reusable read-only form sections
The bill form section components SHALL support a disabled/read-only mode driven by props, so the view screen can reuse them without duplicating layout.

#### Scenario: Rendered in read-only mode
- **WHEN** a form section is rendered with its disabled/read-only prop set
- **THEN** its inputs are non-editable and the add/remove line-item controls are hidden

#### Scenario: Rendered in editable mode
- **WHEN** a form section is rendered without the disabled/read-only prop (the create flow)
- **THEN** its inputs are editable and bound to the draft store as before
