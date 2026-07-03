"use client";

import { useRef, useState } from "react";
import { toast } from "ui-system";

import { useBillDraft } from "@/stores/bill-draft";
import type { ExtractResult } from "@/lib/extraction/schema";
import { persistDraft } from "@/app/bill/new/_lib/persist-draft";

/**
 * Invoice upload + AI extraction flow. Pick a PDF → POST to `/api/extract`
 * (validate → classify → extract). On a valid bill it commits the document +
 * extracted fields to the draft store and auto-saves the draft; any failure
 * toasts and leaves the draft untouched. Owns the file input + object-URL
 * lifecycle. Extraction status/data live in the draft store.
 */
export function useInvoiceExtraction() {
  const inputRef = useRef<HTMLInputElement>(null);
  // File name shown while extracting, before anything is committed to the store.
  const [pendingName, setPendingName] = useState<string | null>(null);

  const setFile = useBillDraft((s) => s.setFile);
  const setFileUrl = useBillDraft((s) => s.setFileUrl);
  const setStatus = useBillDraft((s) => s.setStatus);
  const loadExtraction = useBillDraft((s) => s.loadExtraction);
  const clearContent = useBillDraft((s) => s.clearContent);

  function pick() {
    inputRef.current?.click();
  }

  async function runExtraction(next: File, nextUrl: string) {
    setStatus("extracting");
    setPendingName(next.name);
    try {
      const body = new FormData();
      body.append("file", next);
      const res = await fetch("/api/extract", { method: "POST", body });
      const result = (await res.json()) as ExtractResult;

      // Any error (invalid/too large/too many pages/encrypted, or NOT_A_BILL) →
      // toast only. Don't preload the document or any data.
      if (!result.ok) {
        URL.revokeObjectURL(nextUrl);
        setStatus("idle");
        toast.error(result.error.message);
        return;
      }

      // Valid bill: commit the document + fields, then auto-save so it's
      // resumable / shows in the Drafts tab.
      setFile(next);
      setFileUrl(nextUrl);
      loadExtraction(result.data);
      try {
        await persistDraft();
      } catch (err) {
        console.error("[bill] auto-save draft failed", err);
      }
      toast.success("Invoice read — form pre-filled from the PDF.");
    } catch {
      URL.revokeObjectURL(nextUrl);
      setStatus("idle");
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setPendingName(null);
    }
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    // Drop any previously loaded document/data — nothing shows until the new
    // file is validated and confirmed to be a bill.
    const prev = useBillDraft.getState().fileUrl;
    if (prev) URL.revokeObjectURL(prev);
    clearContent();
    if (next) {
      const nextUrl = URL.createObjectURL(next);
      void runExtraction(next, nextUrl);
    }
    // Reset the input so re-picking the same file still fires onChange.
    e.target.value = "";
  }

  return { inputRef, pick, onInput, pendingName };
}
