import { defineConfig } from "drizzle-kit";

// Migrações versionadas em ./drizzle. Gere com `npm run db:generate` após alterar src/server/db/schema.ts.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
