"use client";

import { FileText, Landmark } from "lucide-react";
import { cn } from "ui-system";

import { PAYMENT_METHODS } from "@/lib/payment-methods";

/** Slug → icon. Icons stay in the UI; slugs/labels come from the shared catalog. */
const METHOD_ICONS: Record<string, typeof Landmark> = {
  ach: Landmark,
  check: FileText,
};

/**
 * Payment-method form section — a selector shown in every bill state. Editable
 * in the create flow; rendered read-only (disabled) on the bill view.
 */
export function PaymentMethodSection({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange?: (slug: string) => void;
  disabled?: boolean;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Payment method</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_METHODS.map((m) => {
          const active = value === m.slug;
          const Icon = METHOD_ICONS[m.slug];
          return (
            <button
              key={m.slug}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(m.slug)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3 rounded-none border px-4 py-3 text-left transition-colors",
                active ? "border-foreground bg-muted" : "border-input",
                disabled ? "cursor-default" : "hover:bg-muted/50"
              )}
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
