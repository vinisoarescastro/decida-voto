import postgres from "postgres";
import { E2E } from "../playwright.config";

/** Começa cada execução com o banco de teste limpo (preserva a lista de municípios). */
export default async function globalSetup() {
  const sql = postgres(E2E.databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await sql`truncate participacoes, resultados, respostas, limites_requisicao, tokens_usados, admin_sessoes, configuracoes cascade`;
  } catch (erro) {
    throw new Error(`Banco de teste indisponível. Rode "npm run db:test:up" e "npm run db:migrate". (${erro})`);
  } finally {
    await sql.end();
  }
}
