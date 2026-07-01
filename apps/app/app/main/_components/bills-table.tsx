"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge, Button, DataTable } from "ui-system";

export type BillRow = {
  id: string;
  number: string;
  vendor: string;
  status:
    | "DRAFT"
    | "NEEDS_REVIEW"
    | "APPROVED"
    | "SCHEDULED"
    | "PAID"
    | "FAILED";
  overdue: boolean;
  amount: number;
  currency: string;
  dueDate: string;
};

const STATUS: Record<
  BillRow["status"],
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs review", variant: "warning" },
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
      <span className="font-medium">{row.getValue("vendor")}</span>
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
