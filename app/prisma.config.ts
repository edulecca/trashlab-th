import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env or accepts `url` in the schema datasource.
// `dotenv/config` loads DATABASE_URL; the CLI (migrate/seed) reads it here.
// The runtime PrismaClient connects via a driver adapter (see lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
