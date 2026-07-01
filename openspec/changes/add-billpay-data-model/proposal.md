## Why

The Bill Pay (Accounts Payable) product needs a backend before any screens can hold real data. Everything the product does — listing bills, moving them through their lifecycle, scheduling and recording payments, reporting AP aging — depends on a well-shaped data model. This change establishes that model with Prisma so the rest of the product can be built on realistic, queryable data instead of hardcoded fixtures.

## What Changes

- Introduce Prisma into the `/app` workspace (schema, generator, datasource, client).
- Model the core AP domain: `User`, `Vendor`, `Bill`, `BillLineItem`, `PaymentMethod`, `Payment`.
- Encode the **bill lifecycle** as a status enum state machine: `DRAFT → NEEDS_REVIEW → APPROVED → SCHEDULED → PAID` (+ `FAILED`). `OVERDUE` is **derived** (`dueDate < now AND status != PAID`), never stored.
- Encode **ingestion source** as an enum on `Bill`: `MANUAL | OCR | EMAIL | CSV` (mirrors Ramp's upload / AP email / CSV / OCR entry points).
- Model `Bill → Payment` as **1:N** to support failed-then-retry and partial payments; a normal bill has 0 or 1. `Payment` carries its own status enum: `SCHEDULED | PROCESSING | PAID | FAILED`.
- Represent all money as Prisma **`Decimal`** (never `Float`) with an explicit `currency` on `Bill`.
- Add a **seed script** with realistic demo data (users, vendors, bills across every status, line items, payment methods, payments).
- Use **PostgreSQL** as the datasource (native `Decimal`, production-realistic); the app connects via a `DATABASE_URL` connection string (local or hosted Postgres).

## Capabilities

### New Capabilities
- `billpay-data-model`: The persistent domain model for Accounts Payable — entities (User, Vendor, Bill, BillLineItem, PaymentMethod, Payment), their relationships, the bill lifecycle state machine, the payment status model, money/currency representation, and the derivation rule for overdue bills.
- `demo-seed-data`: A reproducible seed of realistic Accounts Payable data covering every bill status and payment state, so the UI and any queries can be developed and demoed against representative data.

### Modified Capabilities
<!-- None — this is the first backend change; no existing specs to modify. -->

## Impact

- **Workspace**: `/app` gains `prisma/schema.prisma`, `prisma/seed.ts`, and a generated Prisma Client. New dev/prod scripts (`prisma generate`, `migrate`, `db seed`).
- **Dependencies**: adds `prisma` (dev) and `@prisma/client` to `/app`; requires a reachable PostgreSQL instance via `DATABASE_URL` (local or hosted).
- **No UI impact yet**: this change is data-only. Screens, server actions, and API routes consume this model in later changes.
- **Out of MVP scope (deferred, noted for later changes)**: recurring bills, allocation templates / multi-category line-item splits, real OCR parsing (mock the parse), multi-step approval workflows, and multi-tenant / Organization scoping.
