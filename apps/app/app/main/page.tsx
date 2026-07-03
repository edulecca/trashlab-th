import Link from "next/link";
import { Suspense } from "react";
import { Button } from "ui-system";

import { BillsView } from "./_components/bills-view";

export const dynamic = "force-dynamic";

export default function BillsPage() {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
        <Button asChild size="lg">
          <Link href="/bill/new">New Bill</Link>
        </Button>
      </div>
      {/* Client island: status tabs + table, fed by useBills (TanStack Query). */}
      <Suspense>
        <BillsView />
      </Suspense>
    </div>
  );
}
