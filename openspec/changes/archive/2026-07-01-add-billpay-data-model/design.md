## Context

This is the first backend change for the Bill Pay (Accounts Payable) product. Until now the repo is a monorepo with a Next.js app in `/app` and a design system in `/ui-system` (Storybook). There is no persistence layer. The product's screens — bill list, bill detail, scheduling and recording payments, AP aging — all need a shared, queryable domain model. This design defines the Prisma data layer that later UI/API changes build on.

The entity set and three key decisions were agreed up front: money as `Decimal`, `Bill → Payment` as 1:N, and `Payment` carrying its own status.

## Goals / Non-Goals

**Goals:**

- A Prisma schema that faithfully models the AP domain (User, Vendor, Bill, BillLineItem, PaymentMethod, Payment) and the bill lifecycle.
- Correct money handling (`Decimal` + `currency`) and a derived (not stored) overdue concept.
- A 1:N Bill→Payment relation that makes failed-then-retry and partial payments expressible.
- Simple local setup: point `DATABASE_URL` at a Postgres instance, then generate → migrate → seed → run.
- Realistic seed data covering every status.

**Non-Goals:**

- No UI, server actions, or API routes in this change (data layer only).
- No recurring bills, allocation templates / multi-category splits, real OCR, multi-step approvals, or multi-tenant Organization scoping (deferred).
- No production database hardening (connection pooling, read replicas, migrations CI). A single Postgres connection is the demo target.

## Decisions

### Decision: PostgreSQL as the datasource
Use PostgreSQL (`provider = "postgresql"`), connected via a `DATABASE_URL` env var (local Docker/Postgres.app or a hosted provider such as Neon/Supabase). Postgres gives native `numeric`/`Decimal`, real enum support, and production-realistic behavior.
- **Alternative — SQLite**: zero external service and the fastest "runs immediately" path, but weaker money/enum fidelity and less representative of a real AP system. Rejected in favor of production realism.
- **Trade-off**: reviewers must supply a `DATABASE_URL` (a hosted free-tier Postgres or local instance). Mitigated by documenting the exact setup steps and keeping the schema standard so any Postgres works.

### Decision: Prisma 7 with the `prisma-client` generator + pg driver adapter
Use Prisma 7 (current). Verified against the official docs: the legacy `prisma-client-js` generator is deprecated; v7's `prisma-client` generator is the default and requires an `output` path (client is generated into the repo at `app/generated/prisma`, imported from there — not `@prisma/client`). v7 also **removed `url` from the schema datasource** and no longer auto-loads `.env`:
- The Migrate/CLI connection URL lives in `prisma.config.ts` (which `import "dotenv/config"` to load `.env`).
- The **runtime** client connects via a **driver adapter** (`@prisma/adapter-pg` + `pg`), constructed with `connectionString: process.env.DATABASE_URL` in the client singleton and in the seed.
- **Alternative — Prisma 6 (`prisma-client-js`, `url = env()` in schema)**: simpler and adapter-free, but uses a deprecated generator. Rejected to stay on the current, documented path.
- **Trade-off**: more moving parts (config file, dotenv, driver adapter), offset by no query-engine binary to bundle — cleaner for Next.js/serverless.

### Decision: Prisma lives in `/app`
The schema, client, and seed live in the `/app` workspace because the app is the only consumer of data. `/ui-system` stays product-agnostic (it must never import app/domain types). This preserves the one-way dependency `app → ui-system`.
- **Alternative — a `/db` workspace**: cleaner separation if multiple apps shared the DB, but there is only one app; extra workspace is overhead without benefit for the MVP.

### Decision: Money as `Decimal`, currency on `Bill`
All monetary fields use Prisma `Decimal`. `Bill.currency` (string code, default `"USD"`) carries the unit. Line items and payments inherit the bill's currency by context (not duplicated per row) for the MVP.
- **Alternative — integer minor units (cents)**: also correct and avoids decimal libraries, but `Decimal` is more readable in queries/seed and Prisma supports it directly. Chosen for clarity.

### Decision: Overdue is derived at read time
No `OVERDUE` enum value. A helper (`dueDate < now AND status != PAID`) computes it wherever needed. This keeps status transitions clean (overdue is a function of time, not a state you move into) and avoids a background job to flip statuses.

### Decision: `source` enum separate from `uploadedById`
`source` (`MANUAL|OCR|EMAIL|CSV`) records the ingestion channel; `uploadedById` records the responsible user. These are orthogonal (an OCR'd bill still has an owner). Modeling them separately mirrors Ramp's multiple entry points without conflating "how" with "who".

### Decision: `Bill → Payment` 1:N with `Payment.status`
A bill has many payments. A normal bill has 0 or 1, but the 1:N shape lets a `FAILED` payment stay on record while a retry is created, and allows partial payments later. `Payment.status` (`SCHEDULED|PROCESSING|PAID|FAILED`) tracks each attempt's execution independently of the bill's lifecycle `status`.
- **Alternative — 1:1**: simpler, but then failure/retry has nowhere to live and payment history is lost. Rejected.

### Decision: `PaymentMethod` is a lookup catalog
A small catalog keyed by unique `slug` (`ach`, `check`, `wire`, `card`). Payments reference it. Keeping methods as data (not an enum) lets the seed and future UI list them without code changes, and leaves room to later attach per-vendor payment details.

### Decision: IDs and cascade
Primary keys are UUID/cuid strings. `BillLineItem` and `Payment` cascade-delete with their parent `Bill`; `Vendor`/`User`/`PaymentMethod` are restrict-on-delete (they are referenced, not owned).

## Risks / Trade-offs

- **Requires a running Postgres** → the demo no longer runs from `npm` alone; mitigated by documenting a one-line hosted (Neon/Supabase) or local (Docker) setup and committing the migration so schema creation is a single `migrate` command.
- **Line-item totals vs `Bill.amount` can drift** → the seed reconciles them; enforcing equality is an app-layer validation concern (later change), not a DB constraint, to keep OCR/manual edits flexible.
- **Storing `Bill.amount` and line items both** → intentional redundancy: `amount` is the authoritative invoice total (may come from OCR), line items are the breakdown. Documented so consumers treat `amount` as source of truth.
- **No enforced status-transition guard at the DB level** → transitions are validated in the app/service layer in a later change; the schema only constrains the set of legal values.

## Migration Plan

1. Add `prisma` (dev) + `@prisma/client` to `/app`; add scripts (`db:generate`, `db:migrate`, `db:seed`, `db:reset`).
2. Set `DATABASE_URL` to a Postgres instance in `/app/.env`.
3. Author `prisma/schema.prisma` (`provider = "postgresql"`, models, enums).
4. Run the initial migration to create the schema in Postgres.
5. Author and run `prisma/seed.ts`.
6. Verify the client generates and the seed populates every status.

Rollback: drop the schema / reset the database (`prisma migrate reset`) and remove the migration; the change is additive and isolated to `/app` with no other systems affected.

## Open Questions

- Currency: MVP assumes a single `currency` per bill (default `USD`) and does not do FX. Acceptable for the demo; revisit if multi-currency reporting is wanted.
- Whether `PaymentMethod` should later become per-vendor payment destinations (vendor bank accounts) rather than a global catalog — deferred, not needed for MVP.
