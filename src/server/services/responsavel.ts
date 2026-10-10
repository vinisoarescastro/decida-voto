import { inArray, sql } from "drizzle-orm";
import { RESPONSAVEL_VAZIO, type Responsavel } from "@/lib/responsavel";
import { configuracoes } from "../db/schema";
import type { AnyDb } from "../db/types";

const CHAVES = { nome: "responsavel_nome", email: "responsavel_email" } as const;

/** Lê o responsável pelos dados. Campos nunca configurados voltam vazios. */
export async function lerResponsavel(db: AnyDb): Promise<Responsavel> {
  const linhas = await db
    .select({ chave: configuracoes.chave, valor: configuracoes.valor })
    .from(configuracoes)
    .where(inArray(configuracoes.chave, Object.values(CHAVES)));
  const valores = new Map(linhas.map((l) => [l.chave, l.valor]));
  return {
    nome: valores.get(CHAVES.nome) ?? RESPONSAVEL_VAZIO.nome,
    email: valores.get(CHAVES.email) ?? RESPONSAVEL_VAZIO.email,
  };
}

/** Grava nome e e-mail juntos (os dados já devem ter passado por responsavelSchema). */
export async function salvarResponsavel(db: AnyDb, r: Responsavel): Promise<void> {
  await db
    .insert(configuracoes)
    .values([
      { chave: CHAVES.nome, valor: r.nome },
      { chave: CHAVES.email, valor: r.email },
    ])
    .onConflictDoUpdate({
      target: configuracoes.chave,
      set: { valor: sql`excluded.valor`, atualizadoEm: sql`now()` },
    });
}
