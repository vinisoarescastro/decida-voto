import { cookies } from "next/headers";
import { candidates, positions, positionsFile, questions, questionsFile } from "@/lib/data";
import { participacaoSchema } from "@/lib/participacao-schema";
import { db } from "@/server/db/client";
import { env } from "@/server/env";
import { cookieSeguro, ipDoCliente, json, lerJson, origemValida } from "@/server/http";
import { hashDiario, verificarToken } from "@/server/security/crypto";
import { consumir, REGRAS } from "@/server/security/rate-limit";
import { DadosInvalidos, registrarParticipacao } from "@/server/services/participacoes";
import { consumirNonce } from "@/server/services/tokens";

/** Marca o dispositivo após o envio, para dificultar repetições (não identifica a pessoa). */
const COOKIE_PARTICIPOU = "dv_participou";
const TRINTA_DIAS = 30 * 24 * 60 * 60;
const TOKEN_MAXIMO_SEGUNDOS = 2 * 60 * 60;

const base = {
  questions,
  candidates,
  positions,
  versaoPerguntas: questionsFile.version,
  versaoPosicoes: positionsFile.version,
};

export async function POST(req: Request) {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });

  const jar = await cookies();
  if (jar.has(COOKIE_PARTICIPOU)) return json(409, { erro: "Este dispositivo já participou recentemente." });

  const corpo = await lerJson(req);
  const entrada = participacaoSchema.safeParse(corpo);
  if (!entrada.success) return json(400, { erro: "Dados inválidos." });

  // Campo-isca preenchido: provável robô. Responde como sucesso, mas não grava nada.
  if (entrada.data.site !== "") return json(201, { ok: true });

  const token = verificarToken(env().FORM_TOKEN_SECRET, entrada.data.token, {
    minimoSegundos: env().FORM_MIN_SECONDS,
    maximoSegundos: TOKEN_MAXIMO_SEGUNDOS,
  });
  if (!token.ok) return json(400, { erro: "Sessão do questionário inválida ou expirada. Recomece, por favor." });

  const ip = ipDoCliente(req);
  const segredo = env().RATE_LIMIT_SECRET;
  for (const regra of [REGRAS.envioPorIpHora, REGRAS.envioPorIpDia, REGRAS.envioGlobalHora]) {
    const chave = hashDiario(segredo, regra.escopo, regra === REGRAS.envioGlobalHora ? "global" : ip);
    const r = await consumir(db(), regra, chave);
    if (!r.permitido) {
      return json(429, { erro: "Muitas participações a partir desta rede. Tente mais tarde." }, { "Retry-After": String(r.tentarAposSegundos) });
    }
  }

  const expira = new Date(token.emitidoEm + TOKEN_MAXIMO_SEGUNDOS * 1000);
  if (!(await consumirNonce(db(), token.nonce, expira))) return json(409, { erro: "Esta participação já foi registrada." });

  try {
    await registrarParticipacao(db(), entrada.data, base);
  } catch (erro) {
    if (erro instanceof DadosInvalidos) return json(400, { erro: "Dados inválidos." });
    throw erro;
  }

  jar.set(COOKIE_PARTICIPOU, "1", { httpOnly: true, secure: cookieSeguro, sameSite: "strict", maxAge: TRINTA_DIAS, path: "/" });
  return json(201, { ok: true });
}
