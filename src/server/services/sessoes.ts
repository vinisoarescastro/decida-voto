import { and, eq, lt, ne, or } from "drizzle-orm";
import type { Papel } from "@/lib/admin-usuarios";
import { adminSessoes, adminUsuarios } from "../db/schema";
import type { AnyDb } from "../db/types";
import { novoTokenSessao, sha256 } from "../security/crypto";

export const COOKIE_ADMIN = "dv_admin";
/** Duração máxima da sessão, mesmo com uso contínuo. */
export const SESSAO_MAXIMA_MS = 8 * 60 * 60 * 1000;
/** Encerra a sessão após este tempo sem uso. */
export const SESSAO_OCIOSA_MS = 30 * 60 * 1000;

/** Quem está usando o painel nesta sessão. */
export type UsuarioSessao = { id: string; usuario: string; nome: string; papel: Papel; senhaProvisoria: boolean };

/** Cria a sessão da pessoa e devolve o token do cookie. Só o hash do token é gravado. */
export async function criarSessao(db: AnyDb, usuarioId: string, agora: Date = new Date()): Promise<string> {
  const token = novoTokenSessao();
  await db.insert(adminSessoes).values({
    tokenHash: sha256(token),
    usuarioId,
    criadaEm: agora,
    ultimoAcesso: agora,
    expiraEm: new Date(agora.getTime() + SESSAO_MAXIMA_MS),
  });
  return token;
}

/**
 * Valida a sessão e renova o tempo de inatividade (e o "último acesso" da pessoa). Sessões vencidas ou de
 * usuário desativado são apagadas. Devolve quem está logado, ou null.
 */
export async function validarSessao(db: AnyDb, token: string | undefined, agora: Date = new Date()): Promise<UsuarioSessao | null> {
  if (!token || token.length > 100) return null;
  const hash = sha256(token);
  const [linha] = await db
    .select({
      expiraEm: adminSessoes.expiraEm,
      ultimoAcesso: adminSessoes.ultimoAcesso,
      id: adminUsuarios.id,
      usuario: adminUsuarios.usuario,
      nome: adminUsuarios.nome,
      papel: adminUsuarios.papel,
      senhaProvisoria: adminUsuarios.senhaProvisoria,
      ativo: adminUsuarios.ativo,
    })
    .from(adminSessoes)
    .innerJoin(adminUsuarios, eq(adminUsuarios.id, adminSessoes.usuarioId))
    .where(eq(adminSessoes.tokenHash, hash));
  if (!linha) return null;
  const vencida = !linha.ativo || linha.expiraEm <= agora || agora.getTime() - linha.ultimoAcesso.getTime() > SESSAO_OCIOSA_MS;
  if (vencida) {
    await db.delete(adminSessoes).where(eq(adminSessoes.tokenHash, hash));
    return null;
  }
  await db.update(adminSessoes).set({ ultimoAcesso: agora }).where(eq(adminSessoes.tokenHash, hash));
  await db.update(adminUsuarios).set({ ultimoAcessoEm: agora }).where(eq(adminUsuarios.id, linha.id));
  return { id: linha.id, usuario: linha.usuario, nome: linha.nome, papel: linha.papel, senhaProvisoria: linha.senhaProvisoria };
}

export async function encerrarSessao(db: AnyDb, token: string | undefined) {
  if (token) await db.delete(adminSessoes).where(eq(adminSessoes.tokenHash, sha256(token)));
}

/** Encerra as sessões da pessoa (todas, ou todas menos a atual). Usado em reset, troca de senha e desativação. */
export async function encerrarSessoesDoUsuario(db: AnyDb, usuarioId: string, exceto?: string) {
  const condicao = exceto ? and(eq(adminSessoes.usuarioId, usuarioId), ne(adminSessoes.tokenHash, sha256(exceto))) : eq(adminSessoes.usuarioId, usuarioId);
  await db.delete(adminSessoes).where(condicao);
}

export async function limparSessoesVencidas(db: AnyDb, agora: Date = new Date()) {
  await db
    .delete(adminSessoes)
    .where(or(lt(adminSessoes.expiraEm, agora), lt(adminSessoes.ultimoAcesso, new Date(agora.getTime() - SESSAO_OCIOSA_MS))));
}
