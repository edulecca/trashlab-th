import {
  Circle,
  CircleCheck,
  CircleDollarSign,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

import type { BillStatus } from "./bill-row";

/** How a bill status renders as a Badge (label + ui-system Badge variant). */
type BadgeVariant = "secondary" | "outline" | "success" | "destructive";

export const STATUS_DISPLAY: Record<
  BillStatus,
  { label: string; variant: BadgeVariant }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  REVIEWED: { label: "Reviewed", variant: "outline" },
  APPROVED: { label: "Approved", variant: "secondary" },
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

// Overview grouping: the bill lifecycle collapsed into ordered sections.
export const CATEGORY_ORDER = [
  "review",
  "approval",
  "release",
  "paid",
] as const;
export type CategoryKey = (typeof CATEGORY_ORDER)[number];

export const STATUS_CATEGORY: Record<
  BillStatus,
  { key: CategoryKey; label: string; Icon: LucideIcon }
> = {
  DRAFT: { key: "review", label: "Ready for review", Icon: Circle },
  REVIEWED: { key: "approval", label: "Awaiting approval", Icon: CircleCheck },
  APPROVED: { key: "release", label: "Ready for release", Icon: CircleDot },
  FAILED: { key: "release", label: "Ready for release", Icon: CircleDot },
  PAID: { key: "paid", label: "Paid", Icon: CircleDollarSign },
};

/** Rank a status by its section order — used to sort rows into contiguous groups. */
export const categoryRank = (status: BillStatus) =>
  CATEGORY_ORDER.indexOf(STATUS_CATEGORY[status].key);
