import { describe, it, expect, afterAll } from "vitest";

import { prisma } from "@/lib/prisma";
import { findOrCreateVendor } from "../vendors";

const NAME = "__test vendor dedup__";

// Hits the real DB — skipped when DATABASE_URL isn't set. Test rows are cleaned up.
describe.skipIf(!process.env.DATABASE_URL)("findOrCreateVendor (DB)", () => {
  afterAll(async () => {
    await prisma.vendor.deleteMany({ where: { name: NAME } });
    await prisma.$disconnect();
  });

  it("reuses the vendor for the same name+email, creates a new one for a different email", async () => {
    const a = await findOrCreateVendor(NAME, "a@x.com");
    const b = await findOrCreateVendor(NAME, "a@x.com");
    const c = await findOrCreateVendor(NAME, "b@x.com");

    expect(b.id).toBe(a.id); // same name+email → reused
    expect(c.id).not.toBe(a.id); // different email → new
  });
});
