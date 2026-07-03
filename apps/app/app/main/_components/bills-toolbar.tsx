"use client";

import { CalendarDays, Download, ListFilter } from "lucide-react";

import { BillsSearch } from "./bills-search";
import { ColumnsMenu } from "./columns-menu";
import { OptionsMenu } from "./options-menu";

/** Disabled icon button — a visual placeholder for controls built in a later change. */
function PlaceholderIcon({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={`${label} (coming soon)`}
      title="Coming soon"
      className="grid size-9 cursor-not-allowed place-items-center rounded-full text-muted-foreground/50"
    >
      {children}
    </button>
  );
}

/**
 * The bills table toolbar: borderless search on the left, and a cluster of
 * controls on the right. Columns and Options are live; filter / calendar /
 * export are placeholders until the filters change lands.
 */
export function BillsToolbar() {
  return (
    <div className="flex items-center gap-3 border-b">
      <div className="flex-1">
        <BillsSearch />
      </div>
      <div className="flex items-center gap-1.5">
        <PlaceholderIcon label="Filter">
          <ListFilter className="size-4" />
        </PlaceholderIcon>
        <PlaceholderIcon label="Date range">
          <CalendarDays className="size-4" />
        </PlaceholderIcon>
        <ColumnsMenu />
        <PlaceholderIcon label="Export">
          <Download className="size-4" />
        </PlaceholderIcon>
        <OptionsMenu />
      </div>
    </div>
  );
}
