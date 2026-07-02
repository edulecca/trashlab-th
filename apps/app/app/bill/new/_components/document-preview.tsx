"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "ui-system";

import { useBillDraft } from "@/stores/bill-draft";
import type { ExtractResult } from "@/lib/ai/schema";

/**
 * Right-column preview of the source invoice.
 *
 * The user picks a PDF; we show it in the native viewer and POST it to
 * /api/extract, which pre-fills the create-bill form (via the draft store).
 */
export function DocumentPreview() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<{ file: File; url: string } | null>(null);

  const setFile = useBillDraft((s) => s.setFile);
  const setStatus = useBillDraft((s) => s.setStatus);
  const setError = useBillDraft((s) => s.setError);
  const loadExtraction = useBillDraft((s) => s.loadExtraction);
  const status = useBillDraft((s) => s.status);

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

  async function runExtraction(file: File) {
    setStatus("extracting");
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const result = (await res.json()) as ExtractResult;
      if (result.ok) {
        loadExtraction(result.data);
      } else {
        setStatus("error");
        setError(result.error.message);
      }
    } catch {
      setStatus("error");
      setError("Upload failed. Check your connection and try again.");
    }
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const nextUrl = next ? URL.createObjectURL(next) : null;
    urlRef.current = nextUrl;
    setDoc(next && nextUrl ? { file: next, url: nextUrl } : null);
    setFile(next);
    if (next) void runExtraction(next);
  }

  const file = doc?.file ?? null;
  const url = doc?.url ?? null;
  const extracting = status === "extracting";

  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-4">
        <span className="truncate text-sm font-medium">
          {file ? file.name : "Invoice"}
        </span>
        {file ? (
          <Button variant="ghost" size="sm" onClick={pick} disabled={extracting}>
            <RefreshCw data-icon="inline-start" />
            Cambiar
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 p-4">
        {url ? (
          <div className="relative h-full">
            <iframe
              // #navpanes=0 hides the native viewer's page-thumbnail sidebar;
              // view=FitH fits the page to the panel width.
              src={`${url}#navpanes=0&view=FitH`}
              title={file?.name ?? "Invoice preview"}
              className="h-full w-full rounded-lg border bg-background"
            />
            {extracting ? (
              <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-background/70 text-sm font-medium backdrop-blur-sm">
                <Loader2 className="size-4 animate-spin" />
                Reading invoice…
              </div>
            ) : null}
          </div>
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
