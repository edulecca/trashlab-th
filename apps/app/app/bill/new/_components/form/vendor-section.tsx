import type { ChangeEvent } from "react";
import { Input } from "ui-system";

import type { DraftForm } from "@/stores/bill-draft";
import { SectionBadge } from "./section-badge";

/** Vendor fields (name + email). Presentational — data + handlers come via props. */
export function VendorSection({
  form,
  disabled = false,
  onChange,
}: {
  form: DraftForm;
  disabled?: boolean;
  onChange?: (key: keyof DraftForm, value: string) => void;
}) {
  // Disabled/view mode passes no handler, so nothing crosses a server boundary.
  const set = (key: keyof DraftForm) =>
    disabled
      ? undefined
      : (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange?.(key, e.target.value);

  const complete = form.vendorName.trim().length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Vendor</h2>
        {!disabled ? <SectionBadge complete={complete} /> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Vendor name"
          value={form.vendorName}
          onChange={set("vendorName")}
          placeholder="Acme Inc."
          disabled={disabled}
        />
        <Input
          label="Vendor email"
          type="email"
          value={form.vendorEmail}
          onChange={set("vendorEmail")}
          placeholder="billing@acme.com"
          disabled={disabled}
        />
      </div>
    </section>
  );
}
