import { FileText } from "lucide-react";

/**
 * Read-only source PDF for the bill view. Streams the stored file from
 * `/api/bills/[id]/file`; shows an empty state when the bill has no file.
 */
export function BillPdfPanel({
  billId,
  hasFile,
}: {
  billId: string;
  hasFile: boolean;
}) {
  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex h-11 shrink-0 items-center border-b bg-background px-4">
        <span className="truncate text-sm font-medium">Invoice</span>
      </div>

      <div className="min-h-0 flex-1 p-4">
        {hasFile ? (
          <iframe
            // #navpanes=0 hides the native viewer sidebar; view=FitH fits width.
            src={`/api/bills/${billId}/file#navpanes=0&view=FitH`}
            title="Invoice"
            className="h-full w-full rounded-lg border bg-background"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background">
            <FileText className="size-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No se cargó pdf</p>
          </div>
        )}
      </div>
    </div>
  );
}
