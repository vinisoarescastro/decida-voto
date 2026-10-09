import { defineConfig, devices } from "@playwright/test";

// Testa o build de produção (rode `npm run build` antes) contra o banco de teste (`npm run db:test:up`).
// As credenciais abaixo são exclusivas de teste e não valem em nenhum ambiente real.
export const E2E = {
  baseURL: "http://localhost:4173",
  databaseUrl: process.env.TEST_DATABASE_URL ?? "postgres://postgres:teste@127.0.0.1:55432/decida_voto_teste",
  adminUsuario: "admin-teste",
  adminSenha: "senha-de-teste-e2e",
  minimoGrupo: 5,
};

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: E2E.baseURL },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin|api/ },
  ],
  webServer: {
    command: "node scripts/start-standalone.mjs",
    url: E2E.baseURL,
    reuseExistingServer: false,
    env: {
      PORT: "4173",
      HOSTNAME: "localhost",
      DATABASE_URL: E2E.databaseUrl,
      APP_ORIGIN: E2E.baseURL,
      FORM_TOKEN_SECRET: "e2e-form-token-secret-0123456789abcdef",
      RATE_LIMIT_SECRET: "e2e-rate-limit-secret-0123456789abcdef",
      ADMIN_USERNAME: E2E.adminUsuario,
      ADMIN_PASSWORD_HASH:
        "scrypt:131072:8:1:x9ICcHA+Wlkc/QU51hMvCQ==:WjPz8GN4ML7TLmpFhpgJqWE4VY5SWU/JTb3ArS8wAl1L/nnnosJ/duehDG8mYlTxl5nv/OC2qBuHFVannRr0DA==",
      PRIVACY_MIN_GROUP: String(E2E.minimoGrupo),
      FORM_MIN_SECONDS: "1",
    },
  },
});
