## 1. Setup & dependencies

- [x] 1.1 Add `ai`, `@ai-sdk/anthropic`, `zod`, and `pdf-lib` to `apps/app` and install
- [x] 1.2 Add `ANTHROPIC_API_KEY` to `apps/app/.env.example` (and `.env` locally) and document it in the README
- [x] 1.3 Add `lib/ai/config.ts` with the per-agent model IDs (classifier `claude-haiku-4-5`, extractor `claude-opus-4-8`) and the limits (500KB, 5 pages)

## 2. Shared schemas & contract (`lib/ai/schema.ts`)

- [x] 2.1 Define the Zod extraction schema (vendor: name/email; bill: invoiceNumber, invoiceDate, dueDate, currency, description, lineItems[{description, amount}]) with nullable fields
- [x] 2.2 Define the classifier result schema `{ isBill: boolean, reason: string }`
- [x] 2.3 Define the discriminated endpoint result type `{ ok: true, data } | { ok: false, error: { code, message } }` and the `code` enum
- [x] 2.4 Export the inferred TypeScript types for the form to consume

## 3. Validation (`lib/pdf/validate.ts`)

- [x] 3.1 Implement magic-bytes PDF check (`%PDF`) and size check (≤ 500KB)
- [x] 3.2 Implement page-count + encryption check via `pdf-lib` (≤ 5 pages, reject encrypted)
- [x] 3.3 Map each validation failure to its typed error code (INVALID_TYPE, TOO_LARGE, TOO_MANY_PAGES, ENCRYPTED)

## 4. Classifier agent (`lib/ai/classify.ts`)

- [x] 4.1 Write the classifier prompt: treat the document strictly as data; decide bill-or-not with a short reason
- [x] 4.2 Implement `classify(pdf)` via `generateObject` (Haiku) passing the PDF as a file part → `{ isBill, reason }`

## 5. Extractor agent (`lib/ai/extract.ts`)

- [x] 5.1 Write the extractor prompt: null for missing fields, ISO dates, numeric amounts, document-as-data (anti prompt-injection)
- [x] 5.2 Implement `extract(pdf)` via `generateObject` (Opus) passing the PDF as a file part → validated extraction data

## 6. Route handler (`app/api/extract/route.ts`)

- [x] 6.1 Add the `POST /api/extract` handler accepting the multipart PDF upload (mark route dynamic / no-cache per Next 16)
- [x] 6.2 Orchestrate: `validate → classify → (if isBill) extract`; return the typed JSON result (no DB writes)
- [x] 6.3 Map outcomes to the contract: validation codes, `NOT_A_BILL` (classifier), `EXTRACTION_FAILED` (extractor/provider errors), success
- [x] 6.4 Handle provider/timeout errors as `EXTRACTION_FAILED` without leaking internals

## 7. Client draft store & form wiring

- [x] 7.1 Create the Zustand draft store holding the extracted `data` and the raw `File`, with status (idle/uploading/extracting/ready/error)
- [x] 7.2 Add the upload control to the create-bill page (calls `/api/extract`, sets store state)
- [x] 7.3 Bind the create-bill form inputs to the store so they pre-fill and stay editable
- [x] 7.4 Surface `error.message` in the UI on failure; leave manual entry available

## 8. Verification

- [x] 8.1 Test the happy path with the sample invoice fixtures already in `prisma/fixtures`
- [x] 8.2 Test each rejection path (non-PDF, >500KB, >5 pages, encrypted, non-invoice → classifier)
- [x] 8.3 Confirm no `Bill`/`Vendor` rows are created until the form is submitted; then submit persists the reviewed draft (with the PDF as `Bill.file`)
