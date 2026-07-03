## MODIFIED Requirements

### Requirement: Bill lifecycle is an enum state machine

A `Bill` SHALL have a `status` drawn from the enum `DRAFT`, `NEEDS_REVIEW`, `REVIEWED`, `APPROVED`, `SCHEDULED`, `PAID`, `FAILED`. The intended forward path is `DRAFT → NEEDS_REVIEW → REVIEWED → APPROVED → SCHEDULED → PAID`, with `FAILED` reachable from `SCHEDULED` when a payment attempt fails. Application logic SHALL compare statuses by name and MUST NOT depend on the enum's declaration order.

#### Scenario: Valid status values

- **WHEN** a bill is persisted
- **THEN** its `status` is one of the seven enum values and defaults to `DRAFT` on creation when not otherwise specified

#### Scenario: Reviewed precedes approval

- **WHEN** a bill has been reviewed but not yet approved
- **THEN** its `status` is `REVIEWED`, distinct from `NEEDS_REVIEW` (not yet reviewed) and `APPROVED` (already approved)

#### Scenario: Failure returns a bill to actionable state

- **WHEN** a scheduled bill's payment fails
- **THEN** the bill's `status` becomes `FAILED` so it can be retried
