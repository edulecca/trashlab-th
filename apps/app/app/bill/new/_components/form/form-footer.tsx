"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "ui-system";

/** Sticky footer: save/create actions with an inline save-status message. */
export function FormFooter({
  saving,
  extracting = false,
  saved,
  saveError,
  onSaveDraft,
  onConfirm,
}: {
  saving: boolean;
  /** True while a PDF is being scanned — actions stay disabled until it's done. */
  extracting?: boolean;
  saved: boolean;
  saveError: string | null;
  onSaveDraft: () => void;
  onConfirm: () => void;
}) {
  const disabled = saving || extracting;
  return (
    <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-background px-8 py-3">
      {saveError ? (
        <span className="mr-auto flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {saveError}
        </span>
      ) : saved ? (
        <span className="mr-auto flex items-center gap-1.5 text-sm text-green-600">
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
