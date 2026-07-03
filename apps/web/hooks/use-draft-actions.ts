"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "ui-system";

import { useBillDraft } from "@/stores/bill-draft";
import { confirmBill, deleteBill } from "@/app/bill/new/actions";
import { persistDraft } from "@/app/bill/new/_lib/persist-draft";

/**
 * Create-flow mutations, same pattern as `useBillActions` for the table: wrap the
 * server actions in React Query mutations to centralize invalidation of the
 * `["bills"]` query + toasts + `isPending`. `save`/`confirm` persist the draft
 * first (`persistDraft`); `remove` targets the store's current draft.
 *
 * Feedback split: `save` reports inline in the footer (isSuccess/isError);
 * `confirm`/`remove` toast (they navigate away on success).
 */
export function useDraftActions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const billId = useBillDraft((s) => s.billId);
  const reset = useBillDraft((s) => s.reset);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["bills"] });

  const save = useMutation({
    mutationFn: () => persistDraft(),
    onSuccess: () => invalidate(),
    onError: (err) => console.error("[bill] save draft failed", err),
  });

  const confirm = useMutation({
    mutationFn: async () => {
      const id = await persistDraft();
      await confirmBill(id);
      return id;
    },
    onSuccess: (id) => {
      invalidate();
      toast.success("Bill confirmed.");
      router.push(`/bill/view/${id}`);
    },
    onError: (err) => {
      console.error("[bill] confirm failed", err);
      toast.error("Could not confirm the bill. Try again.");
    },
  });

  const remove = useMutation({
    mutationFn: () => {
      if (!billId) throw new Error("No draft to delete.");
      return deleteBill(billId);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Bill deleted.");
      reset();
      router.push("/main");
    },
    onError: (err) => {
      console.error("[bill] delete failed", err);
      toast.error("Could not delete the bill. Try again.");
    },
  });

  return { save, confirm, remove };
}
