import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

// Reuse a single PrismaClient across hot reloads in dev to avoid exhausting
// database connections (Next.js recreates modules on every change).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 connects through a driver adapter; the URL is read from the env
// (Next.js loads .env at runtime) rather than from schema.prisma.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
