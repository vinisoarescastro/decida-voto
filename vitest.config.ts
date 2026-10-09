import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Testes de integração (banco real) rodam em configuração própria: npm run test:integration
    exclude: ["src/**/*.int.test.ts", "node_modules/**"],
  },
});
