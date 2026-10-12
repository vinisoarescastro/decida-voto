import { positionsFile, questionsFile } from "@/lib/data";
import { referenciaDe, validarRascunho } from "@/lib/revisao";
import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { json, lerJson } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { descartarRascunho, salvarRascunho } from "@/server/services/revisao";

// Rascunhos da revisão de perguntas e posições. Não alteram o site público (ver src/lib/revisao.ts).

const base = { questions: questionsFile, positions: positionsFile };

/** Salva o rascunho de uma pergunta: { perguntaId, rascunho }. Só master. */
export async function POST(req: Request) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;

  const corpo = (await lerJson(req, 32 * 1024)) as { perguntaId?: unknown; rascunho?: unknown } | undefined;
  const ref = typeof corpo?.perguntaId === "string" ? referenciaDe(base, corpo.perguntaId) : null;
  if (!corpo || !ref) return json(400, { erro: "Pergunta não encontrada." });

  const v = validarRascunho(ref, corpo.rascunho);
  if (!v.ok) return json(400, { erro: v.erros.geral ?? "Confira os campos destacados.", campos: v.erros });

  await salvarRascunho(db(), ref.pergunta.id, v.rascunho, { versaoPerguntas: questionsFile.version, versaoPosicoes: positionsFile.version });
  await registrar(db(), a.usuario, "salvou-revisao", ref.pergunta.theme);
  return json(200, { ok: true, rascunho: v.rascunho });
}

/** Descarta o rascunho (?pergunta=id), voltando ao conteúdo publicado. Só master. */
export async function DELETE(req: Request) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;

  const id = new URL(req.url).searchParams.get("pergunta") ?? "";
  const ref = referenciaDe(base, id);
  if (!ref) return json(400, { erro: "Pergunta não encontrada." });
  await descartarRascunho(db(), id);
  await registrar(db(), a.usuario, "descartou-revisao", ref.pergunta.theme);
  return json(200, { ok: true });
}
