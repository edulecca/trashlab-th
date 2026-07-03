/**
 * Single source of truth for how the bills table is *displayed*: the search
 * text, which columns are visible, and their order. In-memory only — reloading
 * returns to defaults. Row selection is NOT here (it stays inside DataTable
 * until bulk actions need it).
 */
"use client";

import { create } from "zustand";

import type { BillRow } from "@/lib/bill/row";

export type ColumnKey =
  | "vendor"
  | "number"
  | "dueDate"
  | "status"
  | "amount"
  | "action";

/**
 * Column catalog shared by the store, the columns menu, and the table.
 * `locked` columns can't be hidden. `pin` keeps a column fixed at an edge
 * (not reorderable): `vendor` stays first, `action` stays last.
 */
export const COLUMNS: {
  key: ColumnKey;
  label: string;
  locked?: boolean;
  pin?: "start" | "end";
}[] = [
  { key: "vendor", label: "Vendor / owner", locked: true, pin: "start" },
  { key: "number", label: "Invoice" },
  { key: "dueDate", label: "Due date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
  { key: "action", label: "Action", locked: true, pin: "end" },
];

const DEFAULT_ORDER = COLUMNS.map((c) => c.key);
const DEFAULT_VISIBILITY = Object.fromEntries(
  COLUMNS.map((c) => [c.key, true])
) as Record<ColumnKey, boolean>;

type BillsViewState = {
  search: string;
  columnVisibility: Record<ColumnKey, boolean>;
  columnOrder: ColumnKey[];

  /** Rows currently selected in the table (lifted here for bulk actions). */
  selectedRows: BillRow[];
  /** Incremented to tell the table to clear its selection (post bulk action). */
  selectionResetKey: number;

  setSearch: (value: string) => void;
  toggleColumn: (key: ColumnKey) => void;
  setColumnOrder: (order: ColumnKey[]) => void;
  setSelectedRows: (rows: BillRow[]) => void;
  clearSelection: () => void;
  resetFilters: () => void;
  resetView: () => void;
};

export const useBillsView = create<BillsViewState>((set) => ({
  search: "",
  columnVisibility: { ...DEFAULT_VISIBILITY },
  columnOrder: [...DEFAULT_ORDER],
  selectedRows: [],
  selectionResetKey: 0,

  setSearch: (value) => set({ search: value }),
  setSelectedRows: (rows) => set({ selectedRows: rows }),
  clearSelection: () =>
    set((s) => ({
      selectedRows: [],
      selectionResetKey: s.selectionResetKey + 1,
    })),
  toggleColumn: (key) =>
    set((s) => {
      // The locked column can never be hidden.
      if (COLUMNS.find((c) => c.key === key)?.locked) return s;
      return {
        columnVisibility: {
          ...s.columnVisibility,
          [key]: !s.columnVisibility[key],
        },
      };
    }),
  setColumnOrder: (order) => set({ columnOrder: order }),
  resetFilters: () => set({ search: "" }),
  resetView: () =>
    set({
      columnVisibility: { ...DEFAULT_VISIBILITY },
      columnOrder: [...DEFAULT_ORDER],
    }),
}));
