"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "ui-system";

import { PaymentMethodSection } from "@/app/bill/new/_components/form/payment-method-section";
import { updatePaymentMethod } from "@/app/bill/new/actions";

/**
 * Payment-method section on the read-only bill view — the one field that stays
 * editable until the bill is PAID (after which the method is locked, since the
 * recorded Payment already used it). Optimistic: reflect the pick immediately,
 * persist via the server action, revert on failure.
 */
export function EditablePaymentMethod({
  billId,
  initial,
  editable,
}: {
  billId: string;
  initial: string;
  editable: boolean;
}) {
  const [value, setValue] = useState(initial);
  const queryClient = useQueryClient();
  const router = useRouter();

  const save = useMutation({
    mutationFn: (slug: string) => updatePaymentMethod(billId, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      router.refresh();
    },
    onError: (err) => {
      // The optimistic pick is rolled back by the per-call onError below
      // (which closes over the previous value).
      console.error("[bill] update payment method failed", err);
      toast.error("Could not update the payment method. Try again.");
    },
  });

  if (!editable) return <PaymentMethodSection value={initial} disabled />;

  return (
    <PaymentMethodSection
      value={value}
      onChange={(slug) => {
        if (slug === value) return;
        const prev = value;
        setValue(slug);
        save.mutate(slug, { onError: () => setValue(prev) });
      }}
    />
  );
}
