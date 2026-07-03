/**
 * Client-side draft store for the create-bill flow.
 *
 * Holds the form fields (pre-filled from AI extraction, then user-editable), the
 * editable line items, the uploaded file, and the extraction status. Extraction
 * never writes to the DB — persistence happens when the user saves the draft.
 */
"use client";

import { create } from "zustand";

import type { ExtractionData } from "@/lib/ai/schema";

export type DraftStatus = "idle" | "extracting" | "ready" | "error";

/** A single editable line item. Price is a string to keep the input controlled. */
export type DraftLineItem = { description: string; amount: string };

/** Header/vendor fields the form binds to. Line-item prices live in `lineItems`. */
export type DraftForm = {
  vendorName: string;
  vendorEmail: string;
  number: string;
  invoiceDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  currency: string;
  description: string;
  tax: string; // grand-total tax, kept as a string to keep the input controlled
};

const EMPTY_FORM: DraftForm = {
  vendorName: "",
  vendorEmail: "",
  number: "",
  invoiceDate: "",
  dueDate: "",
  currency: "",
  description: "",
  tax: "0",
};

const EMPTY_ITEM: DraftLineItem = { description: "", amount: "" };

function formFromExtraction(data: ExtractionData): DraftForm {
  return {
    vendorName: data.vendor.name ?? "",
    vendorEmail: data.vendor.email ?? "",
    number: data.bill.invoiceNumber ?? "",
    invoiceDate: data.bill.invoiceDate ?? "",
    dueDate: data.bill.dueDate ?? "",
    currency: data.bill.currency ?? "",
    description: data.bill.description ?? "",
    tax: data.bill.tax != null ? String(data.bill.tax) : "0",
  };
}

function itemsFromExtraction(data: ExtractionData): DraftLineItem[] {
  const items = data.bill.lineItems.map((it) => ({
    description: it.description,
    amount: String(it.amount),
  }));
  return items.length > 0 ? items : [{ ...EMPTY_ITEM }];
}

type BillDraftState = {
  form: DraftForm;
  lineItems: DraftLineItem[];
  status: DraftStatus;
  error: string | null;
  file: File | null;

  setField: (key: keyof DraftForm, value: string) => void;
  setLineItem: (index: number, key: keyof DraftLineItem, value: string) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  setFile: (file: File | null) => void;
  setStatus: (status: DraftStatus) => void;
  setError: (message: string | null) => void;
  loadExtraction: (data: ExtractionData) => void;
  reset: () => void;
};

export const useBillDraft = create<BillDraftState>((set) => ({
  form: EMPTY_FORM,
  lineItems: [{ ...EMPTY_ITEM }],
  status: "idle",
  error: null,
  file: null,

  setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
  setLineItem: (index, key, value) =>
    set((s) => ({
      lineItems: s.lineItems.map((it, i) =>
        i === index ? { ...it, [key]: value } : it
      ),
    })),
  addLineItem: () =>
    set((s) => ({ lineItems: [...s.lineItems, { ...EMPTY_ITEM }] })),
  removeLineItem: (index) =>
    set((s) => {
      const next = s.lineItems.filter((_, i) => i !== index);
      return { lineItems: next.length > 0 ? next : [{ ...EMPTY_ITEM }] };
    }),
  setFile: (file) => set({ file }),
  setStatus: (status) => set({ status }),
  setError: (message) => set({ error: message }),
  loadExtraction: (data) =>
    set({
      form: formFromExtraction(data),
      lineItems: itemsFromExtraction(data),
      status: "ready",
      error: null,
    }),
  reset: () =>
    set({
      form: EMPTY_FORM,
      lineItems: [{ ...EMPTY_ITEM }],
      status: "idle",
      error: null,
      file: null,
    }),
}));
