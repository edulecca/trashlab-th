"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge, Button, DataTable } from "ui-system";

import type { BillRow } from "@/lib/bill-row";
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


const columns: ColumnDef<BillRow>[] = [
  {
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
  {
    accessorKey: "number",
    header: "Invoice",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.getValue("number")}
      </span>
    ),
  },
  {
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
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = STATUS[row.original.status];
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  {
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
];

export function BillsTable({ rows }: { rows: BillRow[] }) {
  return <DataTable columns={columns} data={rows} selectable />;
}
