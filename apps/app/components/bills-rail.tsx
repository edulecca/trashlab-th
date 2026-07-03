"use client";

import { useState } from "react";
import Link from "next/link";
import { ListItem, SearchField } from "ui-system";

import { VendorAvatar } from "@/components/vendor-avatar";
import type { BillRow } from "@/lib/bill-row";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  STATUS_TO_CATEGORY,
} from "@/lib/bill-status";
import { billHref, matchesBillSearch } from "@/lib/bills";
import { formatDate, money } from "@/lib/format";

/**
 * Shared bill list rail (new-bill + view screens): a borderless search over a
 * bill list grouped into the same lifecycle sections as the main table. Each
 * item links to the bill (draft → create flow, otherwise → read-only view).
 */
export function BillsRail({ rows }: { rows: BillRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = rows.filter((r) => matchesBillSearch(r, query));
  const groups = CATEGORY_ORDER.map((key) => ({
    key,
    ...CATEGORY_META[key],
    bills: filtered.filter((r) => STATUS_TO_CATEGORY[r.status] === key),
  })).filter((g) => g.bills.length > 0);

  return (
    <>
      {/* Border spans the full rail width; the field content is padded inside it. */}
      <div className="shrink-0">
        <SearchField
          value={query}
          onValueChange={setQuery}
          size="sm"
          placeholder="Search bills"
          aria-label="Search bills"
          className="h-[52px] border-y px-3"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-2">
        {groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No bills found.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.key}>
              <div className="flex items-center gap-2 bg-muted-foreground/15 px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <group.Icon className="size-3.5" />
                {group.label}
                <span className="text-muted-foreground/60">
                  {group.bills.length}
                </span>
              </div>
              <ul>
                {group.bills.map((b) => (
                  <li key={b.id}>
                    <Link href={billHref(b.id, b.status)} className="block">
                      <ListItem
                        className="hover:bg-muted"
                        leftAccessory={
                          <VendorAvatar name={b.vendor} img={b.vendorImg} />
                        }
                        title={b.vendor}
                        subtitle={`${money(b.amount, b.currency)} · Due ${formatDate(b.dueDate)}`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
