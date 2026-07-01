## 1. Prisma setup in /app

- [x] 1.1 Add `prisma` (dev) and `@prisma/client` to `/app` package.json
- [x] 1.2 Add scripts to `/app`: `db:generate`, `db:migrate`, `db:seed`, `db:reset`
- [x] 1.3 Initialize Prisma 7: `postgresql` datasource, `prisma-client` generator (custom output `generated/prisma`), `prisma.config.ts` (loads `.env` via dotenv, holds Migrate url), and the `@prisma/adapter-pg` driver adapter for the runtime client
- [x] 1.4 Set `DATABASE_URL` (Postgres connection string) in `/app/.env`, add `.env.example`, and gitignore `.env`
- [x] 1.5 Create a singleton Prisma Client module (avoid multiple clients in Next dev)

## 2. Enums

- [x] 2.1 Define `BillStatus` enum: `DRAFT`, `NEEDS_REVIEW`, `APPROVED`, `SCHEDULED`, `PAID`, `FAILED`
- [x] 2.2 Define `BillSource` enum: `MANUAL`, `OCR`, `EMAIL`, `CSV`
- [x] 2.3 Define `LineItemType` enum: `EXPENSE`, `ITEM`
- [x] 2.4 Define `PaymentStatus` enum: `SCHEDULED`, `PROCESSING`, `PAID`, `FAILED`

## 3. Models

- [x] 3.1 `User` (id, name, email unique, img?, createdAt, updatedAt) with relations to uploaded and approved bills
- [x] 3.2 `Vendor` (id, name, email?, address?, img?, createdAt, updatedAt) with relation to bills
- [x] 3.3 `Bill` (id, number, status default `DRAFT`, source default `MANUAL`, amount `Decimal`, currency default `"USD"`, invoiceDate, dueDate, fileUrl?, memo?, vendorId, uploadedById, approvedById?, timestamps)
- [x] 3.4 `BillLineItem` (id, billId, description, quantity, unitPrice `Decimal`, total `Decimal`, type, category?, order) with cascade delete from Bill
- [x] 3.5 `PaymentMethod` (id, slug unique, description)
- [x] 3.6 `Payment` (id, billId, amount `Decimal`, status, paymentMethodId, scheduledDate?, processedAt?, timestamps) with cascade delete from Bill
- [x] 3.7 Wire all relations (Bill↔Vendor, Bill↔User uploader/approver, Bill↔LineItem 1:N, Bill↔Payment 1:N, Payment↔PaymentMethod) and set delete behavior (cascade for owned children, restrict for referenced lookups)

## 4. Migrate & generate

- [x] 4.1 Run the initial migration to create the schema in Postgres
- [x] 4.2 Generate the Prisma Client and confirm the six models are typed

## 5. Seed data

- [x] 5.1 Author `prisma/seed.ts` that resets to a known state (idempotent/repeatable)
- [x] 5.2 Seed the `PaymentMethod` catalog (`ach`, `check`, `wire`, `card`)
- [x] 5.3 Seed multiple `User`s and `Vendor`s (realistic names, emails/images where sensible)
- [x] 5.4 Seed bills covering every `BillStatus`, each with line items (mixing `EXPENSE`/`ITEM`) whose totals reconcile with `Bill.amount`
- [x] 5.5 Seed at least one non-`PAID` bill with a past `dueDate` (derived-overdue case)
- [x] 5.6 Seed payments across `SCHEDULED`/`PROCESSING`/`PAID`/`FAILED`, including one bill with a `FAILED` payment followed by a retry (1:N)
- [x] 5.7 Run the seed against a fresh DB and confirm it completes and populates all statuses

## 6. Verification

- [x] 6.1 Add a small `isOverdue(bill)` derivation helper (`dueDate < now && status !== PAID`) and a query sanity check
- [x] 6.2 Confirm money fields are `Decimal` end-to-end (schema → client type → seeded values) with no floating point
- [x] 6.3 Document setup steps (generate/migrate/seed) in the app README section
