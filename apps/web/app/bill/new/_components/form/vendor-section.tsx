import { Input } from "ui-system";

import type { DraftForm } from "@/stores/bill-draft";
import { fieldSetter } from "../../_lib/field-setter";
import { FormSection } from "./form-section";

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
  const set = fieldSetter(disabled, onChange);

  return (
    <FormSection
      title="Vendor"
      complete={form.vendorName.trim().length > 0}
      disabled={disabled}
    >
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
    </FormSection>
  );
}
