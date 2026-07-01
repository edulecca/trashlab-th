/**
 * Client-side draft store for the create-bill flow.
 *
 * Holds the form fields (pre-filled from AI extraction, then user-editable), the
 * uploaded file, and the extraction status. Extraction never writes to the DB —
 * persistence happens when the user submits the form (existing create-bill flow).
 */
"use client";

import { create } from "zustand";

import type { ExtractionData } from "@/lib/ai/schema";

export type DraftStatus = "idle" | "extracting" | "ready" | "error";

/** Flat, input-friendly shape the form binds to. */
export type DraftForm = {
  vendorName: string;
  vendorEmail: string;
  number: string;
  invoiceDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  amount: string;
  currency: string;
  description: string;
};

const EMPTY: DraftForm = {
  vendorName: "",
  vendorEmail: "",
  number: "",
  invoiceDate: "",
  dueDate: "",
  amount: "",
  currency: "",
  description: "",
};

/** Map the extractor's nested output onto the flat form shape. */
function fromExtraction(data: ExtractionData): DraftForm {
  const total = data.bill.lineItems.reduce((sum, it) => sum + it.amount, 0);
  return {
    vendorName: data.vendor.name ?? "",
    vendorEmail: data.vendor.email ?? "",
    number: data.bill.invoiceNumber ?? "",
    invoiceDate: data.bill.invoiceDate ?? "",
    dueDate: data.bill.dueDate ?? "",
    amount: total > 0 ? total.toFixed(2) : "",
    currency: data.bill.currency ?? "",
    description: data.bill.description ?? "",
  };
}

type BillDraftState = {
  form: DraftForm;
  status: DraftStatus;
  error: string | null;
  file: File | null;

  setField: (key: keyof DraftForm, value: string) => void;
  setFile: (file: File | null) => void;
  setStatus: (status: DraftStatus) => void;
  setError: (message: string | null) => void;
  loadExtraction: (data: ExtractionData) => void;
  reset: () => void;
};

export const useBillDraft = create<BillDraftState>((set) => ({
  form: EMPTY,
  status: "idle",
  error: null,
  file: null,

  setField: (key, value) =>
    set((s) => ({ form: { ...s.form, [key]: value } })),
  setFile: (file) => set({ file }),
  setStatus: (status) => set({ status }),
  setError: (message) => set({ error: message }),
  loadExtraction: (data) =>
    set({ form: fromExtraction(data), status: "ready", error: null }),
  reset: () => set({ form: EMPTY, status: "idle", error: null, file: null }),
}));
