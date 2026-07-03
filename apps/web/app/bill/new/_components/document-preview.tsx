"use client";

import { FileText, Loader2, RefreshCw, Upload } from "lucide-react";

import { ScanMessages } from "./scan-messages";
import { Button } from "ui-system";

import { useBillDraft } from "@/stores/bill-draft";
import { useInvoiceExtraction } from "@/hooks/use-invoice-extraction";

/**
 * Right-column preview of the source invoice — presentational. The upload +
 * extraction flow (and the file input / object-URL lifecycle) live in
 * `useInvoiceExtraction`; this renders the empty state, the "reading…" state,
 * and the embedded PDF from the draft store.
 */
export function DocumentPreview() {
  const file = useBillDraft((s) => s.file);
  const url = useBillDraft((s) => s.fileUrl);
  const status = useBillDraft((s) => s.status);

  const { inputRef, pick, onInput, pendingName } = useInvoiceExtraction();

  const extracting = status === "extracting";

  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-4">
        <span className="truncate text-sm font-medium">
          {extracting ? pendingName : (file?.name ?? "Invoice")}
        </span>
        {file && !extracting ? (
          <Button variant="ghost" size="sm" onClick={pick}>
            <RefreshCw data-icon="inline-start" />
            Cambiar
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 p-4">
        {extracting ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border bg-background px-6 text-sm font-medium text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Reading invoice…
            <ScanMessages />
          </div>
        ) : url ? (
          <iframe
            // #navpanes=0 hides the native viewer's page-thumbnail sidebar;
            // view=FitH fits the page to the panel width.
            src={`${url}#navpanes=0&view=FitH`}
            title={file?.name ?? "Invoice preview"}
            className="h-full w-full rounded-lg border bg-background"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-background">
            <FileText className="size-9 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">No document yet</p>
              <p className="text-sm text-muted-foreground">
                Add the vendor invoice to auto-fill the form.
              </p>
            </div>
            <Button onClick={pick}>
              <Upload data-icon="inline-start" />
              Upload PDF
            </Button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onInput}
      />
    </div>
  );
}
