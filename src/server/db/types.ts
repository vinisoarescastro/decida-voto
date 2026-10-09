import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/** Qualquer conexão Drizzle/PostgreSQL (aplicação ou testes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDb = PgDatabase<PgQueryResultHKT, any>;
