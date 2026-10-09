import { db } from "@/server/db/client";
import { env } from "@/server/env";
import { ipDoCliente, json, origemValida } from "@/server/http";
import { emitirToken, hashDiario } from "@/server/security/crypto";
import { consumir, REGRAS } from "@/server/security/rate-limit";

// Emite o token assinado exigido no envio da participação (marca o início do questionário).
export async function POST(req: Request) {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });

  const chave = hashDiario(env().RATE_LIMIT_SECRET, REGRAS.tokenPorIp.escopo, ipDoCliente(req));
  const limite = await consumir(db(), REGRAS.tokenPorIp, chave);
  if (!limite.permitido) {
    return json(429, { erro: "Muitas tentativas a partir desta rede. Tente novamente mais tarde." }, { "Retry-After": String(limite.tentarAposSegundos) });
  }
  return json(200, { token: emitirToken(env().FORM_TOKEN_SECRET) });
}
