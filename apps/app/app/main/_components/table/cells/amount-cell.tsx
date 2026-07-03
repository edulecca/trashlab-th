import { money } from "@/lib/format";

/** Right-aligned, tabular currency amount. */
export function AmountCell({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}) {
  return (
    <div className="text-right font-medium tabular-nums">
      {money(amount, currency)}
    </div>
  );
}
