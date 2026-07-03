"use client";

import { Download } from "lucide-react";
import { cn } from "ui-system";

import { IconButton } from "@/components/icon-button";
import { useBillsView } from "@/stores/bills-view";

/**
 * Toolbar export: downloads the selected bills as CSV from `/api/bills/export`.
 * Disabled (and dimmed) until at least one row is selected; highlighted when it is.
 */
export function ExportButton() {
  const selectedRows = useBillsView((s) => s.selectedRows);
  const count = selectedRows.length;

  function onExport() {
    if (count === 0) return;
    const qs = selectedRows
      .map((r) => `id=${encodeURIComponent(r.id)}`)
      .join("&");
    // Content-Disposition: attachment makes the browser download instead of navigate.
    window.location.href = `/api/bills/export?${qs}`;
  }

  return (
    <IconButton
      onClick={onExport}
      disabled={count === 0}
      className={cn(count > 0 && "text-foreground")}
      aria-label={
        count > 0 ? `Export ${count} selected as CSV` : "Select bills to export"
      }
      title={
        count > 0 ? `Export ${count} selected as CSV` : "Select bills to export"
      }
    >
      <Download className="size-4" />
    </IconButton>
  );
}
