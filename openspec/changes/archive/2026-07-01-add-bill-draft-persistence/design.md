## Context

`add-ai-bill-extraction` delivered the pre-fill: an uploaded PDF is extracted into a Zustand draft store
that the create-bill form binds to. But persistence was left as a stub. This change implements the
"Save draft" write, closing the loop so the reviewed draft — and its PDF blob — reach the database.

## Goals / Non-Goals

**Goals:**
- Persist a reviewed draft as a `Bill` (status DRAFT) with the uploaded PDF stored as `Bill.file`.
- Keep the PDF client-side (Zustand) during review; write it only on save.

**Non-Goals:**
- The Create-bill / approval lifecycle, rich line-item editing, auth, vendor fuzzy-matching.

## Decisions

**1. A server action (`saveDraft`) over a route handler.**
Saving is a form submit from a client component, so a Next server action (`"use server"`) is the natural
fit — the form calls it directly with a `FormData` (fields + the PDF `File`), no extra endpoint or manual
fetch. The action converts the `File` to a `Buffer` and writes `Bill.file`.

**2. Blob persisted on save, not on extraction.**
The PDF is held in the Zustand store (`file`) during review and written only when the user saves — so
uploads that are never confirmed leave no rows or orphaned blobs. This matches the extraction change's
"no DB writes during extraction" decision.

**3. Shallow vendor + fixed uploader for the MVP.**
Vendor is found by exact name or created; uploader is the first `User` (no auth yet). Both are explicit
MVP shortcuts with clear follow-ups (fuzzy vendor matching, real identity).

**4. One derived line item.**
The reviewed form carries a single total `amount`, not itemized rows, so save writes one
`BillLineItem` (description + amount, quantity 1). Faithful itemized editing is a later change.

## Risks / Trade-offs

- **Duplicate vendors** from exact-name-only matching → Accepted for MVP; a fuzzy/email match is the
  documented follow-up.
- **Wrong uploader attribution** (always the first user) → Accepted until auth lands.
- **Line-item fidelity lost** (total instead of itemized) → Accepted; the extractor already returns items,
  so a richer form + persistence is a clean follow-up.
