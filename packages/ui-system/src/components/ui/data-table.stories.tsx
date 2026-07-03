import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "./badge";
import { Button } from "./button";
import { DataTable } from "./data-table";

type BillStatus = "Needs review" | "Scheduled" | "Paid" | "Overdue";

type Bill = {
  vendor: string;
  invoice: string;
  due: string;
  amount: number;
  status: BillStatus;
};

const statusVariant: Record<
  BillStatus,
  "warning" | "secondary" | "success" | "destructive"
> = {
  "Needs review": "warning",
  Scheduled: "secondary",
  Paid: "success",
  Overdue: "destructive",
};

const data: Bill[] = [
  { vendor: "Vercel", invoice: "INV-2041", due: "Jul 12, 2026", amount: 1200, status: "Needs review" },
  { vendor: "AWS", invoice: "INV-2042", due: "Jul 15, 2026", amount: 8430.5, status: "Scheduled" },
  { vendor: "Figma", invoice: "INV-2043", due: "Jul 02, 2026", amount: 540, status: "Paid" },
  { vendor: "Linear", invoice: "INV-2044", due: "Jun 28, 2026", amount: 320, status: "Overdue" },
  { vendor: "Notion", invoice: "INV-2045", due: "Jul 20, 2026", amount: 96, status: "Needs review" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const columns: ColumnDef<Bill>[] = [
  {
    accessorKey: "vendor",
    header: "Vendor",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("vendor")}</span>
    ),
  },
  {
    accessorKey: "invoice",
    header: "Invoice",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("invoice")}</span>
    ),
  },
  {
    accessorKey: "due",
    header: "Due date",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("due")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as BillStatus;
      return <Badge variant={statusVariant[status]}>{status}</Badge>;
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
        {currency.format(row.getValue("amount"))}
      </div>
    ),
  },
];

const meta = {
  title: "Components/DataTable",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Bills: Story = {
  render: () => <DataTable columns={columns} data={data} />,
};

export const Selectable: Story = {
  render: () => <DataTable columns={columns} data={data} selectable />,
};

export const Empty: Story = {
  render: () => <DataTable columns={columns} data={[]} />,
};
