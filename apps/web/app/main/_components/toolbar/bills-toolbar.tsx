"use client";

import { BillsSearch } from "./bills-search";
import { ColumnsMenu } from "./columns-menu";
import { ExportButton } from "./export-button";
import { OptionsMenu } from "./options-menu";

/**
 * The bills table toolbar: borderless search on the left, and a cluster of
 * controls on the right — Columns, Export (CSV of the selected rows), Options.
 */
export function BillsToolbar() {
  return (
    <div className="flex items-center gap-3 border-b bg-muted px-4 md:px-8">
      <div className="flex-1">
        <BillsSearch />
      </div>
      <div className="flex items-center gap-1.5">
        <ColumnsMenu />
        <ExportButton />
        <OptionsMenu />
      </div>
    </div>
  );
}
