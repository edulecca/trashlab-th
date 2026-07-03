## ADDED Requirements

### Requirement: Soft-delete a draft bill
The system SHALL let a user delete a bill while it is a draft by marking it with a `DELETED` status; the row is retained but treated as removed.

#### Scenario: Delete a draft
- **WHEN** a user deletes a bill whose status is `DRAFT`
- **THEN** the bill's status becomes `DELETED`

#### Scenario: Non-draft bills cannot be deleted
- **WHEN** a delete is attempted on a bill whose status is not `DRAFT`
- **THEN** the operation is rejected and the bill is unchanged

#### Scenario: After deletion
- **WHEN** a draft is deleted from the create screen
- **THEN** the draft form is cleared and the user is returned to the bills list

### Requirement: Deleted bills are excluded from every fetch
The system SHALL exclude `DELETED` bills from all bill reads — lists, rails, the API, and single-bill loads.

#### Scenario: Not in the lists
- **WHEN** the bills table, the API, or a rail is fetched
- **THEN** `DELETED` bills are not returned, in any tab/status filter

#### Scenario: Not viewable
- **WHEN** the view screen is opened for a `DELETED` bill's id
- **THEN** it responds as not found
