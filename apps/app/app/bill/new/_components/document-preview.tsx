"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, RefreshCw, Upload } from "lucide-react";
import { Button } from "ui-system";

/**
 * Right-column preview of the source invoice.
 *
 * Renders a real PDF: the user picks a file from disk and we hand the browser's
 * native PDF viewer a local object URL — no upload backend yet. Empty state
 * shows an "Agregar PDF" action.
 */
export function DocumentPreview({
  onFileChange,
}: {
  onFileChange?: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<{ file: File; url: string } | null>(null);

  // Track the live object URL so it can be revoked on unmount.
  const urlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function pick() {
    inputRef.current?.click();
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const nextUrl = next ? URL.createObjectURL(next) : null;
    urlRef.current = nextUrl;
    setDoc(next && nextUrl ? { file: next, url: nextUrl } : null);
    onFileChange?.(next);
  }

  const file = doc?.file ?? null;
  const url = doc?.url ?? null;

  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-4">
        <span className="truncate text-sm font-medium">
          {file ? file.name : "Invoice"}
        </span>
        {file ? (
          <Button variant="ghost" size="sm" onClick={pick}>
            <RefreshCw data-icon="inline-start" />
            Cambiar
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 p-4">
        {url ? (
          <iframe
            src={url}
            title={file?.name ?? "Invoice preview"}
            className="h-full w-full rounded-lg border bg-background"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-background">
            <FileText className="size-9 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">No document yet</p>
              <p className="text-sm text-muted-foreground">
                Add the vendor invoice to get started.
              </p>
            </div>
            <Button onClick={pick}>
              <Upload data-icon="inline-start" />
              Agregar PDF
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
