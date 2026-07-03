"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "ui-system";

import { approveBill, deleteBills, payBill } from "@/app/bill/new/actions";

/**
 * Bill lifecycle transitions as React Query mutations. Single source of truth for
 * moving a bill's status — both the `/main` table (React Query) and the read-only
 * detail page (server-rendered) call these, so `onSuccess` covers both refresh
 * paths: it invalidates the `["bills"]` query *and* `router.refresh()`s the RSC.
 *
 * The underlying `approveBill`/`payBill` are server actions (with their own status
 * guards); `useMutation` just wraps them to centralize invalidation + toasts and
 * expose `isPending`. Each caller gets its own mutation instances, so pending
 * state is isolated per button/row.
 */
export function useBillActions() {
  const queryClient = useQueryClient();
  const router = useRouter();

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["bills"] });
    router.refresh();
  }

  const approve = useMutation({
    mutationFn: (id: string) => approveBill(id),
    onSuccess: () => {
      toast.success("Bill approved.");
      refresh();
    },
    onError: (err) => {
      console.error("[bill] approve failed", err);
      toast.error("Could not approve the bill. Try again.");
    },
  });

  const pay = useMutation({
    mutationFn: (id: string) => payBill(id),
    onSuccess: () => {
      toast.success("Bill paid.");
      refresh();
    },
    onError: (err) => {
      console.error("[bill] pay failed", err);
      toast.error("Could not pay the bill. Try again.");
    },
  });

  // Bulk soft-delete of selected DRAFT rows (the table's Options menu). The
  // action skips non-drafts and returns how many were actually tombstoned.
  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => deleteBills(ids),
    onSuccess: ({ count }) => {
      toast.success(`Deleted ${count} draft bill${count === 1 ? "" : "s"}.`);
      refresh();
    },
    onError: (err) => {
      console.error("[bill] bulk delete failed", err);
      toast.error("Could not delete the selected bills. Try again.");
    },
  });

  return { approve, pay, bulkDelete };
}
