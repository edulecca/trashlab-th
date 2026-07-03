import { formatDate } from "@/lib/format";

/** Due date, with an "Overdue" hint underneath when the bill is past due. */
export function DueDateCell({
  dueDate,
  overdue,
}: {
  dueDate: string;
  overdue: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span>{formatDate(dueDate)}</span>
      {overdue ? (
        <span className="text-xs text-destructive">Overdue</span>
      ) : null}
    </div>
  );
}
