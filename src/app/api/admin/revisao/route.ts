import { cookies } from "next/headers";
import { positionsFile, questionsFile } from "@/lib/data";
import { referenciaDe, validarRascunho } from "@/lib/revisao";
import { db } from "@/server/db/client";
import { json, lerJson, origemValida } from "@/server/http";
import { descartarRascunho, salvarRascunho } from "@/server/services/revisao";
import { COOKIE_ADMIN, validarSessao } from "@/server/services/sessoes";

// Rascunhos da revisão de perguntas e posições. Não alteram o site público (ver src/lib/revisao.ts).

const base = { questions: questionsFile, positions: positionsFile };

async function autorizar(req: Request): Promise<Response | null> {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!(await validarSessao(db(), token))) return json(401, { erro: "Sua sessão expirou. Entre novamente." });
  return null;
}

/** Salva o rascunho de uma pergunta: { perguntaId, rascunho }. */
export async function POST(req: Request) {
  const negado = await autorizar(req);
  if (negado) return negado;

  const corpo = (await lerJson(req, 32 * 1024)) as { perguntaId?: unknown; rascunho?: unknown } | undefined;
  const ref = typeof corpo?.perguntaId === "string" ? referenciaDe(base, corpo.perguntaId) : null;
  if (!corpo || !ref) return json(400, { erro: "Pergunta não encontrada." });

  const v = validarRascunho(ref, corpo.rascunho);
  if (!v.ok) return json(400, { erro: v.erros.geral ?? "Confira os campos destacados.", campos: v.erros });

  await salvarRascunho(db(), ref.pergunta.id, v.rascunho, { versaoPerguntas: questionsFile.version, versaoPosicoes: positionsFile.version });
  return json(200, { ok: true, rascunho: v.rascunho });
}

/** Descarta o rascunho (?pergunta=id), voltando ao conteúdo publicado. */
export async function DELETE(req: Request) {
  const negado = await autorizar(req);
  if (negado) return negado;

  const id = new URL(req.url).searchParams.get("pergunta") ?? "";
  if (!referenciaDe(base, id)) return json(400, { erro: "Pergunta não encontrada." });
  await descartarRascunho(db(), id);
  return json(200, { ok: true });
}
