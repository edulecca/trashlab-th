import type { Vendor } from "@/generated/prisma/client";

import { prisma } from "../prisma";

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
