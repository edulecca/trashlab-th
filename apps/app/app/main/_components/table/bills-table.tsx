"use client";

import { DataTable } from "ui-system";

import type { BillRow } from "@/lib/bill-row";
import { categoryRank, STATUS_CATEGORY } from "@/lib/bill-status";
import { matchesBillSearch } from "@/lib/bills";
import { useBillsView } from "@/stores/bills-view";
import { ACTION_COLUMN, COLUMN_DEFS } from "./columns";

// Adapter for the DataTable's grouping: a bill's status → { key, label, icon }.
function billCategory(row: BillRow) {
  const { key, label, Icon } = STATUS_CATEGORY[row.status];
  return { key, label, icon: <Icon /> };
}

export function BillsTable({
  rows,
  grouped = false,
  loading = false,
}: {
  rows: BillRow[];
  /** Group rows into lifecycle sections (Overview tab). */
  grouped?: boolean;
  /** Show skeleton rows while the bills are loading. */
  loading?: boolean;
}) {
  const search = useBillsView((s) => s.search);
  const columnVisibility = useBillsView((s) => s.columnVisibility);
  const columnOrder = useBillsView((s) => s.columnOrder);

  // Derived data columns (store is the source of truth for visibility/order),
  // then the fixed action column pinned last.
  const columns = [
    ...columnOrder
      .filter((key) => columnVisibility[key])
      .map((key) => COLUMN_DEFS[key]),
    ACTION_COLUMN,
  ];

  const filtered = rows.filter((r) => matchesBillSearch(r, search));

  // When grouping, rows must be contiguous by category so the DataTable emits a
  // header per section. Sort is stable, so intra-section order is preserved.
  const data = grouped
    ? [...filtered].sort((a, b) => categoryRank(a.status) - categoryRank(b.status))
    : filtered;

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={data}
        selectable
        loading={loading}
        groupBy={grouped ? billCategory : undefined}
      />
    </div>
  );
}
