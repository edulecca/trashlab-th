import type { Bill } from "../generated/prisma/client";
import type { BillRow } from "./bill-row";

/**
 * A bill is overdue when its due date has passed and it has not been paid.
 * Overdue is derived, never stored — see the data-model design.
 */
export function isOverdue(
  bill: Pick<Bill, "dueDate" | "status">,
  now: Date = new Date()
): boolean {
  return bill.status !== "PAID" && bill.dueDate < now;
}

/** Free-text search predicate for a bill row — matches vendor + invoice number. */
export function matchesBillSearch(row: BillRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    row.vendor.toLowerCase().includes(needle) ||
    row.number.toLowerCase().includes(needle)
  );
}
