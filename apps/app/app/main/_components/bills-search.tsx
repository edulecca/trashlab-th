"use client";

import { SearchField } from "@/components/search-field";
import { useBillsView } from "@/stores/bills-view";

/**
 * Borderless, oversized (65px) search field for the bills toolbar. Binds to the
 * view store; filtering happens in the table off `search`.
 */
export function BillsSearch() {
  const search = useBillsView((s) => s.search);
  const setSearch = useBillsView((s) => s.setSearch);

  return (
    <SearchField
      value={search}
      onValueChange={setSearch}
      size="lg"
      aria-label="Search bills"
    />
  );
}
