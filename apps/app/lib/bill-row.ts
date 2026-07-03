import type { Bill, User, Vendor } from "@/generated/prisma/client";
import { BillStatus } from "@/generated/prisma/client";

import { isOverdue } from "./bills";

export type { BillStatus };

/** The set of queryable status strings (DELETED is a hidden tombstone). */
export const BILL_STATUSES = Object.values(BillStatus).filter(
  (s) => s !== BillStatus.DELETED
) as BillStatus[];

/** Row shape consumed by the bills table — the single source of truth shared by the API and the page. */
export type BillRow = {
  id: string;
  number: string;
  vendor: string;
  vendorImg: string | null;
  uploadedBy: string;
  uploadedAt: string;
  status: BillStatus;
  overdue: boolean;
  amount: number;
  currency: string;
  dueDate: string;
  /**
   * When this row duplicates an earlier bill (same invoice number + vendor),
   * the earlier bill's number; otherwise null. Derived client-side over the
   * loaded set — see `annotateDuplicates` — never persisted.
   */
  duplicateOf: string | null;
};

type BillWithRelations = Bill & { vendor: Vendor; uploadedBy: User };

/** Map a Prisma bill (with vendor + uploader) to a table row; `overdue` derived here. */
export function toBillRow(b: BillWithRelations, now: Date = new Date()): BillRow {
  return {
    id: b.id,
    number: b.number,
    vendor: b.vendor.name,
    vendorImg: b.vendor.img,
    uploadedBy: b.uploadedBy.name,
    uploadedAt: b.createdAt.toISOString(),
    status: b.status,
    overdue: isOverdue(b, now),
    amount: Number(b.amount),
    currency: b.currency,
    dueDate: b.dueDate.toISOString(),
    duplicateOf: null, // set later by annotateDuplicates over the loaded set
  };
}
