"use client";

import { Loader2 } from "lucide-react";
import { Button } from "ui-system";

import { useBillActions } from "@/hooks/use-bill-actions";

/**
 * Per-row Pay action for APPROVED bills. Delegates the APPROVED → PAID transition
 * (which also records a Payment) to the shared `useBillActions` hook, which
 * handles the toast and refreshing the table. `stopPropagation` keeps the
 * row-click navigation from firing.
 */
export function PayBillCell({ billId }: { billId: string }) {
  const { pay } = useBillActions();

  return (
    <div className="flex justify-center">
      <Button
        size="md"
        disabled={pay.isPending}
        onClick={(e) => {
          e.stopPropagation();
          pay.mutate(billId);
        }}
      >
        {pay.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Pay Bill
      </Button>
    </div>
  );
}
