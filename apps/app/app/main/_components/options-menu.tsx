"use client";

import { ChevronDown, FilterX, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui-system";

import { useBillsView } from "@/stores/bills-view";

/** Toolbar "Options ▾": reset the search filter or the column view to defaults. */
export function OptionsMenu() {
  const resetFilters = useBillsView((s) => s.resetFilters);
  const resetView = useBillsView((s) => s.resetView);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-3 text-sm font-medium transition-colors hover:bg-muted data-[state=open]:bg-muted">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        Options
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => resetFilters()}>
          <FilterX className="size-4 text-muted-foreground" />
          Reset filters
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => resetView()}>
          <RotateCcw className="size-4 text-muted-foreground" />
          Reset view
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
