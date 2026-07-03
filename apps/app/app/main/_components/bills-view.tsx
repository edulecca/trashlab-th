"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "ui-system";

import type { BillStatus } from "@/lib/bill-row";
import { useBills } from "@/hooks/use-bills";
import { BillsToolbar } from "./bills-toolbar";
import { BillsTable } from "./bills-table";

type TabDef = { key: string; label: string; status: BillStatus[] };

// Each tab maps to a fixed status set; Overview ([]) means all bills.
const TABS: TabDef[] = [
  { key: "overview", label: "Overview", status: [] },
  { key: "draft", label: "Draft", status: ["DRAFT", "NEEDS_REVIEW"] },
  { key: "approval", label: "For Approval", status: ["REVIEWED"] },
  { key: "payment", label: "For Payment", status: ["APPROVED"] },
];

/**
 * Client island for the bills list: status tabs (synced to `?tab=`) over a
 * table fed by `useBills`. Switching a tab refetches the filtered set.
 */
export function BillsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const active = TABS.find((t) => t.key === params.get("tab")) ?? TABS[0];
  const { data: rows, isLoading, isError } = useBills({ status: active.status });

  function selectTab(key: string) {
    const sp = new URLSearchParams(params);
    if (key === TABS[0].key) sp.delete("tab");
    else sp.set("tab", key);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <Tabs value={active.key} onValueChange={selectTab}>
        <TabsList variant="line" size="lg">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <BillsToolbar />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex h-40 items-center justify-center text-sm text-destructive">
          Could not load bills. Try again.
        </div>
      ) : (
        <BillsTable rows={rows ?? []} />
      )}
    </div>
  );
}
