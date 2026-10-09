import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

// Uma única conexão (pool) por processo. Em desenvolvimento, o recarregamento de módulos
// recriaria o pool a cada alteração; por isso ele fica guardado no objeto global.
const globalForDb = globalThis as unknown as { decidaVotoDb?: Db };

export function db(): Db {
  if (!globalForDb.decidaVotoDb) {
    const client = postgres(env().DATABASE_URL, { max: 10, idle_timeout: 30, prepare: true });
    globalForDb.decidaVotoDb = drizzle(client, { schema });
  }
  return globalForDb.decidaVotoDb;
}
