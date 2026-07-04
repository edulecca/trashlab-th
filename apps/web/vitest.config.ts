import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["dotenv/config"], // DATABASE_URL for the DB integration test
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
});
