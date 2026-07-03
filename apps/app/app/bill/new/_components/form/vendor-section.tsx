"use client";

import { Input } from "ui-system";

import { useBillDraft, type DraftForm } from "@/stores/bill-draft";
import { SectionBadge } from "./section-badge";

/** Vendor fields (name + email). Binds directly to the draft store. */
export function VendorSection() {
  const form = useBillDraft((s) => s.form);
  const setField = useBillDraft((s) => s.setField);

  const set =
    (key: keyof DraftForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, e.target.value);

  const complete = form.vendorName.trim().length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Vendor</h2>
        <SectionBadge complete={complete} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Vendor name"
          value={form.vendorName}
          onChange={set("vendorName")}
          placeholder="Acme Inc."
        />
        <Input
          label="Vendor email"
          type="email"
          value={form.vendorEmail}
          onChange={set("vendorEmail")}
          placeholder="billing@acme.com"
        />
      </div>
    </section>
  );
}
