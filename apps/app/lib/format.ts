/** Shared display formatters for money and dates (US locale). */

export function money(amount: number, currency: string) {
  // Tolerate an empty/invalid code (the currency field is editable mid-form).
  const code = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    return `${code.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
