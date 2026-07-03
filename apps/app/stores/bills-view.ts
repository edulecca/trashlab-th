/**
 * Single source of truth for how the bills table is *displayed*: the search
 * text, which columns are visible, and their order. In-memory only — reloading
 * returns to defaults. Row selection is NOT here (it stays inside DataTable
 * until bulk actions need it).
 */
"use client";

import { create } from "zustand";

export type ColumnKey = "vendor" | "number" | "dueDate" | "status" | "amount";

/** Column catalog shared by the store and the columns menu. `vendor` is locked. */
export const COLUMNS: { key: ColumnKey; label: string; locked?: boolean }[] = [
  { key: "vendor", label: "Vendor / owner", locked: true },
  { key: "number", label: "Invoice" },
  { key: "dueDate", label: "Due date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
];

const DEFAULT_ORDER = COLUMNS.map((c) => c.key);
const DEFAULT_VISIBILITY = Object.fromEntries(
  COLUMNS.map((c) => [c.key, true])
) as Record<ColumnKey, boolean>;

type BillsViewState = {
  search: string;
  columnVisibility: Record<ColumnKey, boolean>;
  columnOrder: ColumnKey[];

  setSearch: (value: string) => void;
  toggleColumn: (key: ColumnKey) => void;
  setColumnOrder: (order: ColumnKey[]) => void;
  resetFilters: () => void;
  resetView: () => void;
};

export const useBillsView = create<BillsViewState>((set) => ({
  search: "",
  columnVisibility: { ...DEFAULT_VISIBILITY },
  columnOrder: [...DEFAULT_ORDER],

  setSearch: (value) => set({ search: value }),
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
