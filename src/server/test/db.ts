import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import type { AnyDb } from "../db/types";

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:teste@127.0.0.1:55432/decida_voto_teste";

export function criarDbDeTeste() {
  const client = postgres(TEST_DATABASE_URL, { max: 4, onnotice: () => {} });
  return { db: drizzle(client, { schema }), fechar: () => client.end() };
}

/** Apaga os dados de teste, preservando a tabela de municípios. */
export async function limpar(db: AnyDb) {
  await db.execute(sql`truncate participacoes, resultados, respostas, limites_requisicao, tokens_usados, admin_sessoes, configuracoes, revisao_perguntas cascade`);
}
