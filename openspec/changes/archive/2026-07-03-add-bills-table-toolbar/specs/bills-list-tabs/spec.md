## ADDED Requirements

### Requirement: A view toolbar sits above the tabbed table

The bills list SHALL show a view toolbar (search, column control, options) together with the status tabs. Search SHALL compose with the active status tab: the visible rows are those of the active tab that also match the search. Column visibility and order SHALL apply regardless of the active tab.

#### Scenario: Search composes with the active tab

- **WHEN** the For Payment tab is active and the user searches for a vendor
- **THEN** only `APPROVED` bills whose vendor matches the search are shown

#### Scenario: Column choices persist across tabs

- **WHEN** the user hides a column and then switches tabs
- **THEN** the hidden column stays hidden on the new tab
