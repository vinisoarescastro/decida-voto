import { and, desc, eq, gt } from "drizzle-orm";
import { adminAuditoria } from "../db/schema";
import type { AnyDb } from "../db/types";

// Auditoria do painel. Registra quem entrou, o que visualizou e o que alterou, com data e hora.
// Nunca registra senha (nem provisória), IP ou dado de participação.

export const ACOES = {
  entrou: "Entrou no painel",
  "login-falhou": "Tentativa de entrada com senha errada",
  saiu: "Saiu do painel",
  visualizou: "Visualizou",
  "trocou-senha": "Trocou a própria senha",
  "salvou-revisao": "Salvou rascunho da revisão",
  "descartou-revisao": "Descartou rascunho da revisão",
  "exportou-revisao": "Exportou arquivo da revisão",
  "alterou-responsavel": "Alterou o responsável pelos dados",
  "criou-usuario": "Criou usuário",
  "editou-usuario": "Editou usuário",
  "resetou-senha": "Resetou a senha de",
  "excluiu-usuario": "Excluiu usuário",
} as const;
export type Acao = keyof typeof ACOES;

/** Visualizações repetidas da mesma tela dentro deste intervalo contam uma vez (ex.: troca de filtros). */
export const INTERVALO_VISUALIZACAO_MS = 10 * 60 * 1000;

type Autor = { id: string | null; usuario: string };

export async function registrar(db: AnyDb, autor: Autor, acao: Acao, detalhe = "", agora: Date = new Date()) {
  await db.insert(adminAuditoria).values({ quando: agora, usuarioId: autor.id, usuario: autor.usuario, acao, detalhe: detalhe.slice(0, 200) });
}

/** Registra que a pessoa abriu uma tela do painel, sem repetir em sequência (ver INTERVALO_VISUALIZACAO_MS). */
export async function registrarVisualizacao(db: AnyDb, autor: Autor & { id: string }, tela: string, agora: Date = new Date()) {
  const [recente] = await db
    .select({ id: adminAuditoria.id })
    .from(adminAuditoria)
    .where(
      and(
        eq(adminAuditoria.usuarioId, autor.id),
        eq(adminAuditoria.acao, "visualizou"),
        eq(adminAuditoria.detalhe, tela),
        gt(adminAuditoria.quando, new Date(agora.getTime() - INTERVALO_VISUALIZACAO_MS)),
      ),
    )
    .limit(1);
  if (!recente) await registrar(db, autor, "visualizou", tela, agora);
}

export type RegistroAuditoria = { id: number; quando: Date; usuario: string; acao: string; detalhe: string };

/** Registros mais recentes primeiro, opcionalmente de uma pessoa só. */
export async function listarAuditoria(db: AnyDb, { limite = 200, usuarioId }: { limite?: number; usuarioId?: string } = {}): Promise<RegistroAuditoria[]> {
  return db
    .select({ id: adminAuditoria.id, quando: adminAuditoria.quando, usuario: adminAuditoria.usuario, acao: adminAuditoria.acao, detalhe: adminAuditoria.detalhe })
    .from(adminAuditoria)
    .where(usuarioId ? eq(adminAuditoria.usuarioId, usuarioId) : undefined)
    .orderBy(desc(adminAuditoria.quando), desc(adminAuditoria.id))
    .limit(limite);
}
