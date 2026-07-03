## ADDED Requirements

### Requirement: Bills JSON endpoint filterable by status

The system SHALL expose `GET /api/bills` returning the bills as a JSON array of table rows. The endpoint SHALL accept a repeatable `status` query parameter and return only bills whose status is among the supplied values; when no `status` is supplied it SHALL return all bills. Unrecognized status values SHALL be ignored rather than erroring.

#### Scenario: Filter by one status

- **WHEN** `GET /api/bills?status=REVIEWED` is requested
- **THEN** the response contains only bills with status `REVIEWED`

#### Scenario: Filter by multiple statuses

- **WHEN** `GET /api/bills?status=DRAFT&status=NEEDS_REVIEW` is requested
- **THEN** the response contains bills with either status

#### Scenario: No filter returns all

- **WHEN** `GET /api/bills` is requested with no `status`
- **THEN** the response contains all bills

### Requirement: Endpoint returns table-ready rows with derived overdue

Each returned row SHALL carry the fields the bills table consumes — including vendor name and image, uploader name, upload date, status, amount, currency, due date — and a derived `overdue` boolean computed server-side from the due date and status. The row shape SHALL be the single source of truth shared between the endpoint and the table.

#### Scenario: Overdue derived server-side

- **WHEN** a returned bill is unpaid and its due date is in the past
- **THEN** its row has `overdue: true`, computed by the server (not stored)

#### Scenario: Row carries vendor and uploader context

- **WHEN** a bill row is returned
- **THEN** it includes the vendor name/image and the uploader's name and upload date used by the Vendor cell
