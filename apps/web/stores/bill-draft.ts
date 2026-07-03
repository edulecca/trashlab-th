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
import { DEFAULT_PAYMENT_METHOD } from "@/lib/bill/payment-methods";

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
  paymentMethod: string; // chosen method slug (ach / check)
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
  paymentMethod: DEFAULT_PAYMENT_METHOD,
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
    paymentMethod: DEFAULT_PAYMENT_METHOD,
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
  /** The uploaded PDF (held during review, persisted as Bill.file on save). */
  file: File | null;
  /** Object URL for previewing the uploaded PDF; created/revoked by the uploader. */
  fileUrl: string | null;
  /** The persisted bill's id once saved (null until the draft hits the DB). */
  billId: string | null;

  setField: (key: keyof DraftForm, value: string) => void;
  setLineItem: (index: number, key: keyof DraftLineItem, value: string) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  setFile: (file: File | null) => void;
  setFileUrl: (url: string | null) => void;
  setStatus: (status: DraftStatus) => void;
  setError: (message: string | null) => void;
  setPersisted: (id: string) => void;
  loadExtraction: (data: ExtractionData) => void;
  reset: () => void;
};

export const useBillDraft = create<BillDraftState>((set) => ({
  form: EMPTY_FORM,
  lineItems: [{ ...EMPTY_ITEM }],
  status: "idle",
  error: null,
  file: null,
  fileUrl: null,
  billId: null,

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
  setFileUrl: (fileUrl) => set({ fileUrl }),
  setStatus: (status) => set({ status }),
  setError: (message) => set({ error: message }),
  setPersisted: (id) => set({ billId: id }),
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
      fileUrl: null,
      billId: null,
    }),
}));
