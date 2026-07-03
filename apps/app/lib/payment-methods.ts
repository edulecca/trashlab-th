/**
 * Payment method catalog — the single source of truth for the selectable
 * methods (slug + label) and the default. Slugs mirror the seeded
 * `PaymentMethod` rows. Icons live in the UI (slug → icon map), not here.
 */
export const PAYMENT_METHODS = [
  { slug: "ach", label: "ACH (deposit)" },
  { slug: "check", label: "By Check" },
] as const;

export type PaymentMethodSlug = (typeof PAYMENT_METHODS)[number]["slug"];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodSlug = "ach";
