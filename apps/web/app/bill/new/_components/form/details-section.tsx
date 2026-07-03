import { Input, Textarea } from "ui-system";

import { subtotal as sumItems } from "../../_lib/line-items";
import type { DraftForm, DraftLineItem } from "@/stores/bill-draft";
import { fieldSetter } from "../../_lib/field-setter";
import { FormSection } from "./form-section";

/** Bill header fields (invoice #, currency, dates, description). Presentational. */
export function DetailsSection({
  form,
  lineItems,
  disabled = false,
  onChange,
}: {
  form: DraftForm;
  lineItems: DraftLineItem[];
  disabled?: boolean;
  onChange?: (key: keyof DraftForm, value: string) => void;
}) {
  const set = fieldSetter(disabled, onChange);

  const complete = Boolean(
    form.number && form.invoiceDate && form.dueDate && sumItems(lineItems) > 0
  );

  return (
    <FormSection title="Bill details" complete={complete} disabled={disabled}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Invoice #"
          value={form.number}
          onChange={set("number")}
          placeholder="INV-0001"
          disabled={disabled}
        />
        <Input
          label="Currency"
          className="uppercase"
          value={form.currency}
          onChange={set("currency")}
          placeholder="USD"
          maxLength={3}
          disabled={disabled}
        />
        <Input
          label="Invoice date"
          type="date"
          value={form.invoiceDate}
          onChange={set("invoiceDate")}
          disabled={disabled}
        />
        <Input
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={set("dueDate")}
          disabled={disabled}
        />
        <Textarea
          label="Description"
          containerClassName="sm:col-span-2"
          rows={3}
          value={form.description}
          onChange={set("description")}
          placeholder="What is this bill for?"
          disabled={disabled}
        />
      </div>
    </FormSection>
  );
}
