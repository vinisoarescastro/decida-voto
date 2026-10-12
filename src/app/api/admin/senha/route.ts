import { errosPorCampo, trocaSenhaSchema } from "@/lib/admin-usuarios";
import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { env } from "@/server/env";
import { json, lerJson } from "@/server/http";
import { hashDiario } from "@/server/security/crypto";
import { consumir, REGRAS } from "@/server/security/rate-limit";
import { registrar } from "@/server/services/auditoria";
import { ErroUsuario, trocarSenha } from "@/server/services/usuarios";

/** Troca a própria senha: { senhaAtual, novaSenha, confirmacao }. Obrigatória após a senha provisória. */
export async function POST(req: Request) {
  const a = await autorizarApi(req, { escrita: true, todos: true, permitirProvisoria: true });
  if (a.negado) return a.negado;

  const limite = await consumir(db(), REGRAS.trocaSenhaPorUsuario, hashDiario(env().RATE_LIMIT_SECRET, REGRAS.trocaSenhaPorUsuario.escopo, a.usuario.id));
  if (!limite.permitido) return json(429, { erro: "Muitas tentativas. Aguarde alguns minutos." }, { "Retry-After": String(limite.tentarAposSegundos) });

  const corpo = trocaSenhaSchema.safeParse(await lerJson(req, 2048));
  if (!corpo.success) return json(400, { erro: "Confira os campos destacados.", campos: errosPorCampo(corpo.error) });

  try {
    await trocarSenha(db(), a.usuario.id, corpo.data.senhaAtual, corpo.data.novaSenha, a.token);
  } catch (e) {
    if (e instanceof ErroUsuario) return json(e.status, { erro: e.message, campos: e.campo ? { [e.campo]: e.message } : undefined });
    throw e;
  }
  await registrar(db(), a.usuario, "trocou-senha");
  return json(200, { ok: true });
}
