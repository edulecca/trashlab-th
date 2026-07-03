/** Shared display formatters for money and dates (US locale). */

export function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
