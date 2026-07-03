## ADDED Requirements

### Requirement: Bills list is filterable by status tabs

The bills list SHALL present tabs that filter the table by lifecycle status. The tabs SHALL be: **Overview** (all bills), **Draft** (`DRAFT` and `NEEDS_REVIEW`), **For Approval** (`REVIEWED`), and **For Payment** (`APPROVED`). Selecting a tab SHALL show only the bills whose status is in that tab's set; Overview SHALL show all.

#### Scenario: Draft tab groups two statuses

- **WHEN** the user selects the Draft tab
- **THEN** the table shows only bills with status `DRAFT` or `NEEDS_REVIEW`

#### Scenario: For Approval shows reviewed bills

- **WHEN** the user selects the For Approval tab
- **THEN** the table shows only bills with status `REVIEWED`

#### Scenario: Overview shows everything

- **WHEN** the user selects the Overview tab
- **THEN** the table shows all bills regardless of status, including `SCHEDULED`, `PAID`, and `FAILED`

### Requirement: The list fetches per filter on the client

The list SHALL fetch its rows on the client through a `useBills({ status })` hook backed by TanStack Query, where `status` is a single status, a list of statuses, or omitted (meaning all). Results SHALL be cached per status set so re-selecting a tab does not require a new request while the data is fresh.

#### Scenario: Switching tabs fetches the filtered set

- **WHEN** the active tab changes
- **THEN** the hook requests the bills for that tab's status set and the table renders them

#### Scenario: Cached tab is instant

- **WHEN** the user returns to a tab whose data is still fresh
- **THEN** the cached rows are shown without a new request

### Requirement: Active tab is reflected in the URL

The active tab SHALL be stored in the URL query (`?tab=`) so the filtered view is shareable and survives reload. An absent or unrecognized `?tab=` SHALL fall back to Overview.

#### Scenario: Tab persists across reload

- **WHEN** the user selects For Payment and reloads the page
- **THEN** the For Payment tab is active and its bills are shown

#### Scenario: Unknown tab falls back

- **WHEN** the URL has `?tab=` with an unrecognized value
- **THEN** the Overview tab is shown
