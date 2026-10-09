import { lt } from "drizzle-orm";
import { tokensUsados } from "../db/schema";
import type { AnyDb } from "../db/types";
import { sha256 } from "../security/crypto";

/** Marca o token como usado. Retorna false se ele já tinha sido usado (tentativa de reenvio). */
export async function consumirNonce(db: AnyDb, nonce: string, expiraEm: Date): Promise<boolean> {
  const inseridos = await db
    .insert(tokensUsados)
    .values({ nonceHash: sha256(nonce), expiraEm })
    .onConflictDoNothing()
    .returning({ nonceHash: tokensUsados.nonceHash });
  return inseridos.length === 1;
}

export async function limparTokensExpirados(db: AnyDb, agora: Date = new Date()) {
  await db.delete(tokensUsados).where(lt(tokensUsados.expiraEm, agora));
}
