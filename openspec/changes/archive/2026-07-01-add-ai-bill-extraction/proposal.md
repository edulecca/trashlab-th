## Why

Creating a bill by hand — retyping the vendor, invoice number, dates, and every line item off a
PDF — is the slowest, most error-prone step in the payables workflow. Ramp's Bill Pay ingests the
invoice and pre-fills the bill for the user. We reproduce that: the user drops a PDF and Claude
extracts a structured draft they only need to review, not transcribe.

## What Changes

- Add a **PDF upload → AI extraction** step to the create-bill flow. The user uploads an invoice PDF;
  the app returns a structured draft (vendor + bill fields + line items) that pre-fills the form.
- Add a **server endpoint** (`/api/extract`) that validates the PDF and orchestrates two
  single-responsibility AI agents (Vercel AI SDK, `generateObject` + Zod): a **classifier**
  ("is this a bill?") that short-circuits non-invoices on a cheap model, and an **extractor** that
  pulls the structured fields on the accurate model. Each agent lives in its own module; the route
  only orchestrates.
- Add **upload validation**: PDF only (magic bytes, not just extension), ≤ 500KB, ≤ 5 pages, not
  encrypted. Reject early with a typed JSON error before spending an AI call.
- Add a **client-side draft store (Zustand)** that holds the extracted result; the create-bill form
  inputs consume it. No database writes happen during extraction — persistence occurs when the user
  submits the reviewed form (existing flow).
- Add the AI dependencies: `ai` (Vercel AI SDK), `@ai-sdk/anthropic`, `zod`, and a PDF page-count
  helper (`pdf-lib`). Requires an `ANTHROPIC_API_KEY` env var.

Non-goals (deliberately out of scope for this change): auto-matching the extracted vendor to an
existing `Vendor` (returned raw for now), persisting a draft `Bill` during extraction, real-time
streaming of extraction progress, and multi-file / batch upload.

## Capabilities

### New Capabilities
- `ai-bill-extraction`: Upload validation, the classify-and-extract Claude call, the extraction data
  contract (typed success/error JSON), and the client draft store that pre-fills the create-bill form.

### Modified Capabilities
<!-- None. The create-bill form and the Bill/Vendor data model are consumed as-is; no existing
     spec requirements change. Persisting the reviewed draft uses the current create-bill flow. -->

## Impact

- **New code**: an upload/extract route handler in `apps/app`, a Zod extraction schema shared by the
  server and the form, a Zustand store, and an upload UI control in the create-bill page.
- **New dependencies**: `ai`, `@ai-sdk/anthropic`, `zod`, `pdf-lib` (all in `apps/app`).
- **Config**: `ANTHROPIC_API_KEY` added to `.env` / `.env.example`. Models pinned per agent —
  classifier on `claude-haiku-4-5` (cheap filter), extractor on `claude-opus-4-8` (accuracy) — both
  configurable and reading the key from the env automatically.
- **No schema/migration changes.** `Bill`/`Vendor` are unchanged; the uploaded PDF can be persisted as
  the existing `Bill.file` blob when the user submits.
- **Cost/latency**: a cheap classify call runs first and short-circuits non-invoices; only confirmed
  invoices pay for the extraction call.
