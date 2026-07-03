"use client";

import { useQuery } from "@tanstack/react-query";

import type { BillRow, BillStatus } from "@/lib/bill/row";

/** Normalize the filter to a stable, sorted array so cache keys are order-independent. */
function normalize(status?: BillStatus | BillStatus[]): BillStatus[] {
  if (!status) return [];
  return (Array.isArray(status) ? status : [status]).slice().sort();
}

async function fetchBills(statuses: BillStatus[]): Promise<BillRow[]> {
  const qs = statuses.map((s) => `status=${encodeURIComponent(s)}`).join("&");
  const res = await fetch(`/api/bills${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load bills");
  return res.json() as Promise<BillRow[]>;
}

/**
 * Fetch bills, optionally filtered by one or more statuses. Omitting `status`
 * (or passing an empty list) returns every bill. Cached per status set.
 */
export function useBills(
  { status }: { status?: BillStatus | BillStatus[] } = {}
) {
  const statuses = normalize(status);
  return useQuery({
    queryKey: ["bills", statuses],
    queryFn: () => fetchBills(statuses),
  });
}
