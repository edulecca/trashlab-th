## Why

The create-bill flow could pre-fill a bill draft from an uploaded PDF (see
`add-ai-bill-extraction`) but the "Save draft" button was a stub — nothing was persisted, and the
uploaded PDF was never stored. This change makes the draft (and its PDF blob) actually save.

## What Changes

- Implement the **"Save draft"** action: persist the reviewed bill as a `Bill` row with
  `status = DRAFT` and, when a PDF was uploaded, `source = OCR` and the PDF bytes stored in `Bill.file`.
- **Vendor**: find-or-create by name (matching stays intentionally shallow — a fuzzy/email match is a
  later change).
- Attribute the bill to a user (first user in the DB; no auth yet).
- Persist a single line item derived from the reviewed form (description + amount).
- The PDF lives **only in the client draft store (Zustand)** during review and is written **on save** —
  never during extraction.

Non-goals: the full "Create bill" / approval flow (DRAFT → NEEDS_REVIEW → APPROVED …), rich line-item
editing, authentication / real uploader identity, and vendor fuzzy-matching.

## Capabilities

### New Capabilities
- `bill-draft-persistence`: Saving a reviewed bill draft to the database, including the uploaded PDF blob.

### Modified Capabilities
<!-- None. The create-bill page and Bill/Vendor data model are consumed as-is. -->

## Impact

- **New code**: a `saveDraft` server action in `apps/app/app/bill/new/actions.ts`; the create-bill form's
  "Save draft" button wired to it with saving/saved/error feedback.
- **No schema/migration changes.** Uses the existing `Bill`/`Vendor`/`BillLineItem` models and the
  `Bill.file` blob column.
- **No new dependencies.**
