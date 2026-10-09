import { sql } from "drizzle-orm";
import { limitesRequisicao } from "../db/schema";
import type { AnyDb } from "../db/types";

// Limite de requisições em janela fixa, guardado no PostgreSQL (funciona com várias instâncias).
// A chave já chega como hash (ver hashDiario); nenhum IP é gravado.

export type Regra = { escopo: string; limite: number; janelaSegundos: number };

export const REGRAS = {
  tokenPorIp: { escopo: "token-ip", limite: 30, janelaSegundos: 3600 },
  envioPorIpHora: { escopo: "envio-ip-hora", limite: 10, janelaSegundos: 3600 },
  envioPorIpDia: { escopo: "envio-ip-dia", limite: 50, janelaSegundos: 86400 },
  envioGlobalHora: { escopo: "envio-global-hora", limite: 5000, janelaSegundos: 3600 },
  loginPorIp: { escopo: "login-ip", limite: 10, janelaSegundos: 900 },
  loginPorUsuario: { escopo: "login-usuario", limite: 20, janelaSegundos: 3600 },
} satisfies Record<string, Regra>;

export async function consumir(
  db: AnyDb,
  regra: Regra,
  chaveHash: string,
  agora: Date = new Date(),
): Promise<{ permitido: boolean; tentarAposSegundos: number }> {
  const janelaMs = regra.janelaSegundos * 1000;
  const inicio = new Date(Math.floor(agora.getTime() / janelaMs) * janelaMs);
  const [linha] = await db
    .insert(limitesRequisicao)
    .values({ escopo: regra.escopo, chaveHash, janelaInicio: inicio, contador: 1 })
    .onConflictDoUpdate({
      target: [limitesRequisicao.escopo, limitesRequisicao.chaveHash, limitesRequisicao.janelaInicio],
      set: { contador: sql`${limitesRequisicao.contador} + 1` },
    })
    .returning({ contador: limitesRequisicao.contador });
  const tentarAposSegundos = Math.ceil((inicio.getTime() + janelaMs - agora.getTime()) / 1000);
  return { permitido: linha.contador <= regra.limite, tentarAposSegundos };
}
