## ADDED Requirements

### Requirement: Edit detected line items

The create-bill form SHALL render the bill's line items as an editable list, one row per item, each row
exposing exactly a description input and a price input. When the draft was pre-filled from an uploaded
PDF, the rows SHALL be populated from the extracted line items.

#### Scenario: Detected items shown as rows

- **WHEN** extraction returns line items
- **THEN** the form renders one editable row per item, each with its description and price pre-filled

#### Scenario: Editing a row

- **WHEN** the user edits a row's description or price
- **THEN** the change is reflected in the draft state and the invoice total updates

### Requirement: Add and remove line items

The form SHALL provide an "Add line item" button below the list that appends a new empty row, and each
row SHALL provide a control to remove it.

#### Scenario: Add a row

- **WHEN** the user clicks "Add line item"
- **THEN** a new empty row (blank description and price) is appended and is editable

#### Scenario: Remove a row

- **WHEN** the user removes a row
- **THEN** that row disappears from the list and the invoice total updates

### Requirement: Invoice total

The form SHALL display an "Invoice total" equal to the sum of all line-item prices. The total SHALL be
read-only (derived, not directly editable) and SHALL update as rows are added, removed, or edited.

#### Scenario: Total reflects the rows

- **WHEN** the line items have prices 1000 and 240
- **THEN** the invoice total shows 1240

#### Scenario: Non-numeric price ignored

- **WHEN** a row's price is empty or non-numeric
- **THEN** it contributes 0 to the invoice total (no error)
