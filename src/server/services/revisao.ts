import { eq, sql } from "drizzle-orm";
import { rascunhoSchema, type Rascunho } from "@/lib/revisao";
import { revisaoPerguntas } from "../db/schema";
import type { AnyDb } from "../db/types";

export type RegistroRevisao = {
  rascunho: Rascunho;
  versaoPerguntas: string;
  versaoPosicoes: string;
  atualizadoEm: Date;
};

export type VersoesBase = { versaoPerguntas: string; versaoPosicoes: string };

/** Rascunhos da revisão, por pergunta. Registros que não passam mais na validação são ignorados. */
export async function lerRascunhos(db: AnyDb): Promise<Record<string, RegistroRevisao>> {
  const linhas = await db.select().from(revisaoPerguntas);
  const registros: Record<string, RegistroRevisao> = {};
  for (const l of linhas) {
    const r = rascunhoSchema.safeParse({ ...(l.dados as object), revisada: l.revisada, nota: l.nota });
    if (!r.success) {
      console.error(`Rascunho de revisão inválido ignorado: ${l.perguntaId}`);
      continue;
    }
    registros[l.perguntaId] = { rascunho: r.data, versaoPerguntas: l.versaoPerguntas, versaoPosicoes: l.versaoPosicoes, atualizadoEm: l.atualizadoEm };
  }
  return registros;
}

/** Grava o rascunho da pergunta (já validado por validarRascunho), substituindo o anterior. */
export async function salvarRascunho(db: AnyDb, perguntaId: string, r: Rascunho, versoes: VersoesBase): Promise<void> {
  const valores = {
    dados: { pergunta: r.pergunta, posicoes: r.posicoes },
    revisada: r.revisada,
    nota: r.nota,
    versaoPerguntas: versoes.versaoPerguntas,
    versaoPosicoes: versoes.versaoPosicoes,
  };
  await db
    .insert(revisaoPerguntas)
    .values({ perguntaId, ...valores })
    .onConflictDoUpdate({ target: revisaoPerguntas.perguntaId, set: { ...valores, atualizadoEm: sql`now()` } });
}

/** Volta a pergunta ao conteúdo publicado. */
export async function descartarRascunho(db: AnyDb, perguntaId: string): Promise<void> {
  await db.delete(revisaoPerguntas).where(eq(revisaoPerguntas.perguntaId, perguntaId));
}
