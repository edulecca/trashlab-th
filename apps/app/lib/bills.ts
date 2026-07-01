import type { Bill } from "../generated/prisma/client";

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
