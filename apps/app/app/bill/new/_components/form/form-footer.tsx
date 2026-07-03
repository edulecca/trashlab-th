"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button, cn } from "ui-system";

/** Sticky footer: save/confirm actions, an inline save-status message, and a
 *  left-aligned Delete Bill for persisted drafts. */
export function FormFooter({
  saving,
  extracting = false,
  saved,
  saveError,
  deletable = false,
  onDelete,
  onSaveDraft,
  onConfirm,
}: {
  saving: boolean;
  /** True while a PDF is being scanned — actions stay disabled until it's done. */
  extracting?: boolean;
  saved: boolean;
  saveError: string | null;
  /** Show a "Delete Bill" action on the left (persisted drafts only). */
  deletable?: boolean;
  onDelete: () => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
}) {
  const disabled = saving || extracting;

  return (
    <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-background px-8 py-3">
      {deletable ? (
        <Button
          variant="destructive"
          size="lg"
          className="mr-auto"
          onClick={onDelete}
          disabled={disabled}
        >
          Delete Bill
        </Button>
      ) : null}
      {saveError ? (
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm text-destructive",
            !deletable && "mr-auto"
          )}
        >
          <AlertCircle className="size-4" />
          {saveError}
        </span>
      ) : saved ? (
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm text-green-600",
            !deletable && "mr-auto"
          )}
        >
          <CheckCircle2 className="size-4" />
          Draft saved
        </span>
      ) : null}
      <Button variant="ghost" size="lg" onClick={onSaveDraft} disabled={disabled}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save draft
      </Button>
      <Button size="lg" onClick={onConfirm} disabled={disabled}>
        Confirm
      </Button>
    </div>
  );
}
