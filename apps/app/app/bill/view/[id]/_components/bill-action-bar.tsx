"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "ui-system";

import type { BillStatus } from "@/lib/bill-row";
import { useBillActions } from "@/hooks/use-bill-actions";

/**
 * Sticky action bar for the bill view — mirrors the create flow's footer for
 * consistency. Shows the next lifecycle action driven by status:
 * REVIEWED → Approve, APPROVED → Pay, PAID → paid indicator. Transitions go
 * through the shared `useBillActions` hook (toast + refresh centralized there).
 */
export function BillActionBar({
  billId,
  status,
}: {
  billId: string;
  status: BillStatus;
}) {
  const { approve, pay } = useBillActions();

  return (
    <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-background px-8 py-3">
      {status === "REVIEWED" ? (
        <Button
          size="lg"
          disabled={approve.isPending}
          onClick={() => approve.mutate(billId)}
        >
          {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Approve
        </Button>
      ) : null}

      {status === "APPROVED" ? (
        <Button
          size="lg"
          disabled={pay.isPending}
          onClick={() => pay.mutate(billId)}
        >
          {pay.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Pay Bill
        </Button>
      ) : null}

      {status === "PAID" ? (
        <span className="mr-auto flex items-center gap-1.5 text-sm font-medium text-success-foreground">
          <CheckCircle2 className="size-4" />
          This bill has been paid.
        </span>
      ) : null}
    </div>
  );
}
