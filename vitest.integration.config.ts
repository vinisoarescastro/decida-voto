import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes de integração contra um PostgreSQL real (ver `npm run db:test:up`).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    globalSetup: "./src/server/test/global-setup.ts",
    fileParallelism: false,
    testTimeout: 20000,
  },
});
