import { useBillDraft, type DraftForm } from "@/stores/bill-draft";
import { saveDraft } from "../actions";

/**
 * Persist the current draft store to the DB (upsert) and remember its id.
 * Shared by the extraction flow (auto-save after OCR) and the form buttons so
 * every save targets the same `Bill` row.
 */
export async function persistDraft(): Promise<string> {
  const s = useBillDraft.getState();

  const fd = new FormData();
  (Object.keys(s.form) as (keyof DraftForm)[]).forEach((k) =>
    fd.append(k, s.form[k])
  );
  fd.append("lineItems", JSON.stringify(s.lineItems));
  if (s.billId) fd.append("billId", s.billId);
  // The PDF blob (held in the store during review) is persisted as Bill.file.
  if (s.file) fd.append("file", s.file);

  const { id } = await saveDraft(fd);
  s.setPersisted(id);
  return id;
}
