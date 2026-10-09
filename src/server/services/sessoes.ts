import { eq, lt, or } from "drizzle-orm";
import { adminSessoes } from "../db/schema";
import type { AnyDb } from "../db/types";
import { novoTokenSessao, sha256 } from "../security/crypto";

export const COOKIE_ADMIN = "dv_admin";
/** Duração máxima da sessão, mesmo com uso contínuo. */
export const SESSAO_MAXIMA_MS = 8 * 60 * 60 * 1000;
/** Encerra a sessão após este tempo sem uso. */
export const SESSAO_OCIOSA_MS = 30 * 60 * 1000;

/** Cria a sessão e devolve o token do cookie. Só o hash do token é gravado. */
export async function criarSessao(db: AnyDb, agora: Date = new Date()): Promise<string> {
  const token = novoTokenSessao();
  await db.insert(adminSessoes).values({
    tokenHash: sha256(token),
    criadaEm: agora,
    ultimoAcesso: agora,
    expiraEm: new Date(agora.getTime() + SESSAO_MAXIMA_MS),
  });
  return token;
}

/** Valida a sessão e renova o tempo de inatividade. Sessões vencidas são apagadas. */
export async function validarSessao(db: AnyDb, token: string | undefined, agora: Date = new Date()): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const hash = sha256(token);
  const [sessao] = await db.select().from(adminSessoes).where(eq(adminSessoes.tokenHash, hash));
  if (!sessao) return false;
  const vencida = sessao.expiraEm <= agora || agora.getTime() - sessao.ultimoAcesso.getTime() > SESSAO_OCIOSA_MS;
  if (vencida) {
    await db.delete(adminSessoes).where(eq(adminSessoes.tokenHash, hash));
    return false;
  }
  await db.update(adminSessoes).set({ ultimoAcesso: agora }).where(eq(adminSessoes.tokenHash, hash));
  return true;
}

export async function encerrarSessao(db: AnyDb, token: string | undefined) {
  if (token) await db.delete(adminSessoes).where(eq(adminSessoes.tokenHash, sha256(token)));
}

export async function limparSessoesVencidas(db: AnyDb, agora: Date = new Date()) {
  await db
    .delete(adminSessoes)
    .where(or(lt(adminSessoes.expiraEm, agora), lt(adminSessoes.ultimoAcesso, new Date(agora.getTime() - SESSAO_OCIOSA_MS))));
}
