import { Badge } from "ui-system";

import type { BillStatus } from "@/lib/bill-row";
import { STATUS_DISPLAY } from "@/lib/bill-status";

/** Status badge for the bills table, styled per the status→variant map. */
export function StatusCell({ status }: { status: BillStatus }) {
  const s = STATUS_DISPLAY[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
