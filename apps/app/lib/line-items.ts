/**
 * Pure line-item math. Kept out of the (client) draft store so server components
 * — e.g. the read-only bill view — can call these too.
 */

/** Coerce a controlled numeric string to a number; non-numeric → 0. */
function num(value: string): number {
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

/** Subtotal: sum of line-item prices; non-numeric prices contribute 0. */
export function subtotal(items: { amount: string }[]): number {
  return items.reduce((sum, it) => sum + num(it.amount), 0);
}

/** Grand total the payer owes: subtotal + tax. */
export function invoiceTotal(items: { amount: string }[], tax: string): number {
  return subtotal(items) + num(tax);
}
