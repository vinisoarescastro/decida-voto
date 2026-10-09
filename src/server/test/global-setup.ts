import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { TEST_DATABASE_URL } from "./db";

export default async function setup() {
  const client = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL("../../../drizzle", import.meta.url)) });
  } catch (erro) {
    throw new Error(`Banco de teste indisponível em ${TEST_DATABASE_URL}. Rode "npm run db:test:up". (${erro})`);
  } finally {
    await client.end();
  }
}
