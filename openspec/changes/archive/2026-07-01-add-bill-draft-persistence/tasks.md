## 1. Save-draft server action

- [x] 1.1 Add `saveDraft(FormData)` server action in `app/bill/new/actions.ts`
- [x] 1.2 Parse form fields + the uploaded `File`; convert the PDF to bytes for `Bill.file`
- [x] 1.3 Find-or-create the `Vendor` by name; attribute the bill to the first `User`
- [x] 1.4 Create the `Bill` (status DRAFT, source OCR when a file is present else MANUAL, blob, one derived line item) and `revalidatePath`

## 2. Form wiring

- [x] 2.1 Wire the "Save draft" button to build FormData (store form + `file`) and call `saveDraft`
- [x] 2.2 Add saving / saved / error feedback in the form footer

## 3. Verification

- [x] 3.1 Verify a saved draft persists with `source = OCR`, `status = DRAFT`, PDF blob, vendor, and a line item
- [x] 3.2 Confirm no `Bill` row exists before save (blob held only in the client store)
- [ ] 3.3 End-to-end UI test (upload → extract → Save draft) once the browser extension is connected
