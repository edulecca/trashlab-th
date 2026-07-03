"use client";

import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "ui-system";

import type { BillStatus } from "@/lib/bill/row";
import { useBills } from "@/hooks/use-bills";
import { useSearchParam } from "@/hooks/use-search-param";
import { useBillsView } from "@/stores/bills-view";
import { BillsToolbar } from "./toolbar/bills-toolbar";
import { BillsTable } from "./table/bills-table";

type TabDef = { key: string; label: string; status: BillStatus[] };

// Each tab maps to a fixed status set; Overview ([]) means all bills.
const TABS: TabDef[] = [
  { key: "overview", label: "Overview", status: [] },
  { key: "draft", label: "Draft", status: ["DRAFT"] },
  { key: "approval", label: "For Approval", status: ["REVIEWED"] },
  { key: "payment", label: "For Payment", status: ["APPROVED"] },
];

/**
 * Client island for the bills list: status tabs (synced to `?tab=`) over a
 * table fed by `useBills`. Switching a tab refetches the filtered set.
 */
export function BillsView() {
  // Active tab synced to `?tab=` (default Overview keeps a clean URL).
  const [tab, setTab] = useSearchParam("tab", TABS[0].key);
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const { data: rows, isLoading, isError } = useBills({ status: active.status });

  // Switching tabs shows a different row set — drop any lingering selection so
  // bulk actions never target rows from the previous view.
  const clearSelection = useBillsView((s) => s.clearSelection);
  useEffect(() => {
    clearSelection();
  }, [active.key, clearSelection]);

  return (
    // Break out of the page's horizontal padding so the toolbar and table go
    // edge-to-edge (full-bleed); text inside is re-padded to align with the header.
    <div className="-mx-4 md:-mx-8">
      <Tabs value={active.key} onValueChange={setTab} className="px-4 md:px-8">
        <TabsList variant="line" size="lg">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <BillsToolbar />

      {isError ? (
        <div className="flex h-40 items-center justify-center text-sm text-destructive">
          Could not load bills. Try again.
        </div>
      ) : (
        <BillsTable
          rows={rows ?? []}
          grouped={active.key === "overview"}
          loading={isLoading}
        />
      )}
    </div>
  );
}
