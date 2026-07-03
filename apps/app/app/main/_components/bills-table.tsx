"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge, Button, DataTable } from "ui-system";

import type { BillRow } from "@/lib/bill-row";
import { useBillsView, type ColumnKey } from "@/stores/bills-view";
import { VendorElementRow } from "./vendor-element-row";

export type { BillRow };

const STATUS: Record<
  BillRow["status"],
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs review", variant: "warning" },
  REVIEWED: { label: "Reviewed", variant: "outline" },
  APPROVED: { label: "Approved", variant: "secondary" },
  SCHEDULED: { label: "Scheduled", variant: "outline" },
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );
}

function date(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}


// Column defs keyed by the same keys the view store uses, so visibility/order
// derive by simple lookup.
const COLUMN_DEFS: Record<ColumnKey, ColumnDef<BillRow>> = {
  vendor: {
    id: "vendor",
    accessorKey: "vendor",
    header: "Vendor",
    meta: { className: "border-r" },
    cell: ({ row }) => (
      <VendorElementRow
        vendor={row.original.vendor}
        img={row.original.vendorImg}
        uploadedBy={row.original.uploadedBy}
        uploadedAt={row.original.uploadedAt}
      />
    ),
  },
  number: {
    id: "number",
    accessorKey: "number",
    header: "Invoice",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.getValue("number")}
      </span>
    ),
  },
  dueDate: {
    id: "dueDate",
    accessorKey: "dueDate",
    header: "Due date",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className={row.original.overdue ? "text-destructive" : ""}>
          {date(row.getValue("dueDate"))}
        </span>
        {row.original.overdue ? (
          <Badge variant="destructive" outline>
            Overdue
          </Badge>
        ) : null}
      </div>
    ),
  },
  status: {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = STATUS[row.original.status];
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  amount: {
    id: "amount",
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-mr-2 ml-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown data-icon="inline-end" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">
        {money(row.original.amount, row.original.currency)}
      </div>
    ),
  },
};

/** Does a row match the free-text search? Matches vendor + invoice number. */
function matchesSearch(row: BillRow, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    row.vendor.toLowerCase().includes(needle) ||
    row.number.toLowerCase().includes(needle)
  );
}

export function BillsTable({ rows }: { rows: BillRow[] }) {
  const search = useBillsView((s) => s.search);
  const columnVisibility = useBillsView((s) => s.columnVisibility);
  const columnOrder = useBillsView((s) => s.columnOrder);

  // Derive the columns + rows the DataTable renders — the store is the source
  // of truth, applied here so DataTable stays generic (see design D2).
  const columns = columnOrder
    .filter((key) => columnVisibility[key])
    .map((key) => COLUMN_DEFS[key]);

  const filtered = rows.filter((r) => matchesSearch(r, search));
  const overdue = filtered.filter((r) => r.overdue).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "bill" : "bills"}
        {overdue > 0 ? ` · ${overdue} overdue` : ""}
      </p>
      <DataTable columns={columns} data={filtered} selectable />
    </div>
  );
}
