## Context

The create-bill flow (`apps/app/app/bill/new`, plus the `main` list) already exists and persists a
`Bill` (+ `Vendor`, `BillLineItem`) via Prisma. This change adds an AI ingestion path in front of that
form: upload a PDF invoice, extract a structured draft, pre-fill the form. Claude reads PDFs natively
(no separate OCR), so the pipeline is upload → validate → one model call → draft.

Constraints: this is an MVP take-home; no object storage (S3) is available, and the app runs on Next.js
16 (App Router, React 19). The design was chosen against four decisions the user confirmed: single
structured AI call, 500KB/5-page limit, vendor returned raw (matching deferred), and result loaded into
a Zustand store that the form consumes (no DB write during extraction).

## Goals / Non-Goals

**Goals:**
- Turn an invoice PDF into a reviewable, schema-validated bill draft with one model call.
- Fail fast and cheaply on invalid input (wrong type, too big, too many pages, encrypted, not a bill).
- Keep extraction side-effect-free: it returns data, the user's form submission is what writes to the DB.
- Keep the model/provider swappable and the extraction schema shared between server and form.

**Non-Goals:**
- Vendor auto-matching to an existing `Vendor` (returned raw; matching is a later change).
- Persisting a draft `Bill` during extraction, or storing the PDF anywhere during extraction.
- Streaming extraction progress, multi-file/batch upload, or a review/approval UI beyond form pre-fill.

## Decisions

**1. Two single-responsibility agents (classify → extract), orchestrated by the route.**
Rather than one combined call, the pipeline uses two agents, each its own module and its own
`generateObject` call: a **classifier** that answers `{ isBill, reason }`, and an **extractor** that
returns the structured fields. This keeps responsibilities cleanly separated (each agent has one prompt,
one schema, one job) — which reads well as architecture and is easy to test in isolation — and lets the
classifier short-circuit non-invoices before paying for the expensive extraction. The "format-to-JSON"
step the user originally imagined is *not* a third agent: `generateObject` returns validated JSON
directly, so output formatting is a property of each agent, not a separate stage. Alternative (a single
combined classify+extract call) is cheaper by one call but couples two concerns into one prompt/schema
and can't use a cheaper model for the filter; for this MVP the extra call is negligible and the clarity
wins. The route (`/api/extract`) owns orchestration only: `validate → classify → (if bill) extract`.

**2. Model per agent: classifier on `claude-haiku-4-5`, extractor on `claude-opus-4-8`.**
The classifier is a cheap yes/no filter → Haiku 4.5 (fast, low cost). The extractor needs accuracy →
Opus 4.8. Both IDs live in a config module so they can be swapped (e.g. Sonnet 5 for the extractor). This
is the "cheap agent filters, accurate agent works" pattern. `@ai-sdk/anthropic` reads `ANTHROPIC_API_KEY`
from the env automatically for both.

**3. Validation before the model call, in the route handler.**
Order: magic-bytes (`%PDF`) → size (≤ 500KB) → page count via `pdf-lib` → encryption check (pdf-lib throws
on encrypted docs). Page count needs a real PDF parse, so `pdf-lib` is the one non-AI dependency added for
validation. Claude's own PDF ceiling (32MB / ~100 pages) is far above our limits, so our caps are a
product/cost choice, not a technical one.

**4. PDF passed as a file part; typed result contract.**
The PDF bytes are sent to Claude as a file content part (`{ type: 'file', mediaType: 'application/pdf',
data }`). The endpoint always returns a discriminated JSON result: `{ ok: true, data } | { ok: false,
error: { code, message } }`, with `code` ∈ `INVALID_TYPE | TOO_LARGE | TOO_MANY_PAGES | ENCRYPTED |
NOT_A_BILL | EXTRACTION_FAILED`. The extraction Zod schema is defined once and imported by both the route
and the form types.

**5. Result lives in a Zustand store; form consumes it; DB write deferred.**
On success the client puts `data` (and the raw `File`) into a Zustand draft store. The create-bill form
binds its inputs to the store, so extraction pre-fills a fully editable form. Nothing is written to
Postgres until the user submits — at which point the existing create-bill flow persists the `Bill` and can
store the uploaded PDF as the existing `Bill.file` blob (source `OCR`, status `NEEDS_REVIEW`).

## Module layout

```
apps/app/
  lib/
    ai/
      config.ts      # model IDs per agent + limits (500KB, 5 pages)
      schema.ts      # Zod schemas: classification result + extraction data
      prompts.ts     # system prompts for each agent
      classify.ts    # classifier agent: PDF -> { isBill, reason }
      extract.ts     # extractor agent: PDF -> extraction data
    pdf/
      validate.ts    # magic bytes, size, page count, encryption
  app/api/extract/
    route.ts         # POST: orchestrates validate -> classify -> extract; returns typed result
```

Each agent module exports one function that takes the PDF bytes and returns its typed result; the route
composes them and maps failures to the result contract. The extraction Zod schema is imported by both
`extract.ts` and the create-bill form so the client and server share one source of truth.

## Risks / Trade-offs

- **Prompt injection via PDF text** → The system prompt frames the document strictly as data to extract,
  never as instructions; the output schema constrains what can come back, limiting blast radius.
- **500KB cap excludes many scanned invoices** → Accepted for the MVP (digital-native PDFs). The cap is a
  single constant; raising it to ~2MB is a one-line change if scans must be supported.
- **Model hallucinating values for missing fields** → Schema fields are nullable and the prompt instructs
  "null if not present"; the human reviews every field in the form before submit.
- **Extraction latency (a few seconds for a 5-page PDF)** → Acceptable synchronously for an MVP; the UI
  shows a pending state. Streaming is a non-goal.
- **Amounts/currency mismatch (line items don't sum to the invoice total)** → Out of scope to enforce now;
  captured amounts are numeric and the reviewer can catch discrepancies. A reconciliation check is a
  possible follow-up.

## Open Questions

- Vendor matching strategy (fuzzy by email/name) when we lift the "return raw" non-goal.
- Whether to persist the uploaded PDF into `Bill.file` automatically on submit, or keep it optional.
- Whether to add a line-items-sum-vs-total reconciliation warning in the review UI.
