import { VendorAvatar } from "@/components/vendor-avatar";
import { getVendorSummaries } from "@/lib/bill/vendors";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendorSummaries();

  return (
    <div className="w-full">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Vendors</h1>
        <span className="text-sm text-muted-foreground tabular-nums">
          {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
        </span>
      </div>

      {/* Full-bleed table, matching the Bills list. */}
      <div className="-mx-4 md:-mx-8">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-8 border-b px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase md:px-8">
          <span>Vendor</span>
          <span className="w-32 text-right">Paid</span>
          <span className="w-32 text-right">Owed</span>
        </div>

        {vendors.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No vendors yet.
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-8 border-b px-4 py-3 md:px-8"
            >
              <div className="flex min-w-0 items-center gap-3">
                <VendorAvatar name={v.name} img={v.img} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{v.name}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {v.email ?? "—"}
                  </div>
                </div>
              </div>

              <div className="w-32 text-right text-sm font-medium tabular-nums">
                {v.paid > 0 ? (
                  money(v.paid, "USD")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              <div className="w-32 text-right text-sm font-medium tabular-nums">
                {v.owed > 0 ? (
                  money(v.owed, "USD")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
