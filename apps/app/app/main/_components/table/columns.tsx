import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "ui-system";

import type { BillRow } from "@/lib/bill-row";
import type { ColumnKey } from "@/stores/bills-view";
import { AmountCell } from "./cells/amount-cell";
import { DueDateCell } from "./cells/due-date-cell";
import { PayBillCell } from "./cells/pay-bill-cell";
import { StatusCell } from "./cells/status-cell";
import { VendorCell } from "./cells/vendor-cell";

// Column defs keyed by the same keys the view store uses, so visibility/order
// derive by simple lookup.
export const COLUMN_DEFS: Record<ColumnKey, ColumnDef<BillRow>> = {
  vendor: {
    id: "vendor",
    accessorKey: "vendor",
    header: "Vendor",
    cell: ({ row }) => (
      <VendorCell
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
      <DueDateCell dueDate={row.original.dueDate} overdue={row.original.overdue} />
    ),
  },
  status: {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusCell status={row.original.status} />,
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
      <AmountCell amount={row.original.amount} currency={row.original.currency} />
    ),
  },
};

// Fixed trailing column — always last, never user-configurable (kept out of the
// view store / columns menu). Holds the per-row action for the bill's status.
export const ACTION_COLUMN: ColumnDef<BillRow> = {
  id: "action",
  header: "Action",
  enableSorting: false,
  cell: ({ row }) =>
    row.original.status === "APPROVED" ? (
      <PayBillCell billId={row.original.id} />
    ) : null,
};
