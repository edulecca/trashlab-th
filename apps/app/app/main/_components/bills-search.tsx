"use client";

import { Search } from "lucide-react";

import { useBillsView } from "@/stores/bills-view";

/**
 * Borderless, oversized (80px) search field for the bills toolbar. Binds to the
 * view store; filtering happens in the table off `search`.
 */
export function BillsSearch() {
  const search = useBillsView((s) => s.search);
  const setSearch = useBillsView((s) => s.setSearch);

  return (
    <div className="flex h-20 items-center gap-3">
      <Search className="size-5 shrink-0 text-muted-foreground" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        aria-label="Search bills"
        className="h-full w-full border-0 bg-transparent p-0 text-lg outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  );
}
