"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, FilterX, RotateCcw, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from "ui-system";

import { deleteBills } from "@/app/bill/new/actions";
import { useBillsView } from "@/stores/bills-view";

/**
 * Toolbar "Options ▾": bulk-delete the selected draft bills (only shown when at
 * least one DRAFT row is selected), plus reset the search filter / column view.
 */
export function OptionsMenu() {
  const resetFilters = useBillsView((s) => s.resetFilters);
  const resetView = useBillsView((s) => s.resetView);
  const selectedRows = useBillsView((s) => s.selectedRows);
  const clearSelection = useBillsView((s) => s.clearSelection);

  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  // Only DRAFT bills are deletable (tombstoned); non-drafts in the selection are
  // ignored, so the Delete action reflects just the draft count.
  const draftIds = selectedRows
    .filter((r) => r.status === "DRAFT")
    .map((r) => r.id);
  const draftCount = draftIds.length;

  async function onDelete() {
    if (draftCount === 0) return;
    setDeleting(true);
    try {
      const { count } = await deleteBills(draftIds);
      toast.success(`Deleted ${count} draft bill${count === 1 ? "" : "s"}.`);
      await queryClient.invalidateQueries({ queryKey: ["bills"] });
      clearSelection();
    } catch (err) {
      console.error("[bill] bulk delete failed", err);
      toast.error("Could not delete the selected bills. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-3 text-sm font-medium transition-colors hover:bg-muted data-[state=open]:bg-muted">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        Options
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {draftCount > 0 ? (
          <>
            <DropdownMenuItem
              variant="destructive"
              disabled={deleting}
              onSelect={() => onDelete()}
            >
              <Trash2 className="size-4" />
              Delete {draftCount} draft bill{draftCount === 1 ? "" : "s"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
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
