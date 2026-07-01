import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

type Bill = {
  vendor: string;
  invoice: string;
  due: string;
  amount: string;
  status: { label: string; variant: "secondary" | "warning" | "success" | "destructive" };
};

const bills: Bill[] = [
  { vendor: "Vercel", invoice: "INV-2041", due: "Jul 12, 2026", amount: "$1,200.00", status: { label: "Needs review", variant: "warning" } },
  { vendor: "AWS", invoice: "INV-2042", due: "Jul 15, 2026", amount: "$8,430.50", status: { label: "Scheduled", variant: "secondary" } },
  { vendor: "Figma", invoice: "INV-2043", due: "Jul 02, 2026", amount: "$540.00", status: { label: "Paid", variant: "success" } },
  { vendor: "Linear", invoice: "INV-2044", due: "Jun 28, 2026", amount: "$320.00", status: { label: "Overdue", variant: "destructive" } },
];

export const Bills: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.invoice}>
            <TableCell className="font-medium">{bill.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{bill.invoice}</TableCell>
            <TableCell className="text-muted-foreground">{bill.due}</TableCell>
            <TableCell>
              <Badge variant={bill.status.variant}>{bill.status.label}</Badge>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {bill.amount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
