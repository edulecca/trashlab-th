import type { Vendor } from "@/generated/prisma/client";

import { prisma } from "../prisma";

/** A vendor plus its money totals for the vendors list. */
export type VendorSummary = {
  id: string;
  name: string;
  email: string | null;
  img: string | null;
  /** Σ amount of the vendor's PAID bills — money already paid out. */
  paid: number;
  /** Σ amount of the vendor's APPROVED bills — approved, still owed. */
  owed: number;
};

/**
 * Every vendor with its paid/owed totals, for the vendors page. `paid` sums the
 * vendor's PAID bills, `owed` sums its APPROVED (approved-to-pay) bills. Both are
 * derived from `Bill.amount`, never stored.
 */
export async function getVendorSummaries(): Promise<VendorSummary[]> {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      img: true,
      bills: { select: { amount: true, status: true } },
    },
  });

  return vendors.map((v) => {
    let paid = 0;
    let owed = 0;
    for (const b of v.bills) {
      const amount = Number(b.amount);
      if (b.status === "PAID") paid += amount;
      else if (b.status === "APPROVED") owed += amount;
    }
    return { id: v.id, name: v.name, email: v.email, img: v.img, paid, owed };
  });
}

/**
 * Find a vendor by exact name + email, or create one.
 *
 * Deduping on both fields means re-scanning the same invoice (which yields the
 * same name + email) reuses the existing vendor instead of adding a duplicate.
 * A different email (or name) is treated as a different vendor.
 */
export async function findOrCreateVendor(
  name: string,
  email: string | null
): Promise<Vendor> {
  const cleanName = name.trim() || "Unknown vendor";
  const cleanEmail = email?.trim() || null;

  const existing = await prisma.vendor.findFirst({
    where: { name: cleanName, email: cleanEmail },
  });
  if (existing) return existing;

  return prisma.vendor.create({
    data: { name: cleanName, email: cleanEmail },
  });
}
