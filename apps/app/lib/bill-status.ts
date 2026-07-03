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
  // Never rendered — DELETED bills are excluded from every fetch.
  DELETED: { label: "Deleted", variant: "secondary" },
};

// Overview grouping: the bill lifecycle collapsed into ordered sections.
export const CATEGORY_ORDER = ["review", "approval", "release", "paid"] as const;
export type CategoryKey = (typeof CATEGORY_ORDER)[number];

/** Which section a status belongs to. */
export const STATUS_TO_CATEGORY: Record<BillStatus, CategoryKey> = {
  DRAFT: "review",
  REVIEWED: "approval",
  APPROVED: "release",
  FAILED: "release",
  PAID: "paid",
  DELETED: "review", // unreachable — DELETED is filtered from every fetch
};

/** How a section renders — shared by the table group headers and the new-bill rail. */
export const CATEGORY_META: Record<
  CategoryKey,
  { label: string; Icon: LucideIcon }
> = {
  review: { label: "Ready for review", Icon: Circle },
  approval: { label: "Awaiting approval", Icon: CircleCheck },
  release: { label: "Ready for release", Icon: CircleDot },
  paid: { label: "Paid", Icon: CircleDollarSign },
};

/** Rank a status by its section order — used to sort rows into contiguous groups. */
export const categoryRank = (status: BillStatus) =>
  CATEGORY_ORDER.indexOf(STATUS_TO_CATEGORY[status]);
