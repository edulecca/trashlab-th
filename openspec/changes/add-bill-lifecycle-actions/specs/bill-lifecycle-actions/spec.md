## ADDED Requirements

### Requirement: A draft can be approved

From the create/edit flow, a `DRAFT` bill SHALL be approvable via a primary **Approve** action that persists the current form and sets the bill's status to `APPROVED`. After approving, the user SHALL be taken to the bill's view screen.

#### Scenario: Approve a draft

- **WHEN** the user clicks Approve on a `DRAFT` bill
- **THEN** the current form fields are saved and the bill's status becomes `APPROVED`

#### Scenario: Editing keeps a bill in draft

- **WHEN** the user edits fields of a `DRAFT` bill without approving
- **THEN** the bill's status remains `DRAFT`

### Requirement: An approved bill is paid with a chosen method

When a bill is `APPROVED`, the view screen SHALL show a **Payment method** section offering exactly two options — **ACH (deposit)** and **By Check** — and a **Pay** action. Paying SHALL create a `Payment` for the bill (amount equal to the bill total, using the chosen method) and set the bill's status to `PAID`.

#### Scenario: Payment section appears only when approved

- **WHEN** a bill's status is `APPROVED`
- **THEN** the Payment method section and Pay button are shown; for `DRAFT` or `PAID` they are not

#### Scenario: Pay by ACH

- **WHEN** the user selects ACH and clicks Pay on an `APPROVED` bill
- **THEN** a `Payment` is created with the ACH method and the bill's status becomes `PAID`

#### Scenario: Pay by check

- **WHEN** the user selects By Check and clicks Pay
- **THEN** a `Payment` is created with the check method and the bill's status becomes `PAID`

#### Scenario: Paying requires the approved state

- **WHEN** a pay attempt is made on a bill that is not `APPROVED`
- **THEN** it is rejected and no `Payment` is created

### Requirement: The UI is driven by the bill's status

The bill screens SHALL present actions according to the bill's status: `DRAFT` shows the editable form with Approve; `APPROVED` shows the payment-method section with Pay; `PAID` shows a completed state with no lifecycle actions.

#### Scenario: Paid bill shows no actions

- **WHEN** a bill's status is `PAID`
- **THEN** neither Approve nor Pay controls are shown
