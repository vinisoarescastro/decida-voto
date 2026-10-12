import { positionsFile, questionsFile } from "@/lib/data";
import { aplicarRascunhos, hojeEmBrasilia, serializarArquivo, validarArquivos } from "@/lib/revisao";
import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { json } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { lerRascunhos } from "@/server/services/revisao";

const ARQUIVOS = { perguntas: "questions.json", posicoes: "positions.json" } as const;

/**
 * Baixa questions.json ou positions.json com os rascunhos aplicados (?arquivo=perguntas|posicoes).
 * Para publicar, o arquivo substitui o de src/data e passa pelos testes e pelo build.
 */
export async function GET(req: Request) {
  // Só leitura: master e admin podem baixar.
  const a = await autorizarApi(req);
  if (a.negado) return a.negado;

  const arquivo = new URL(req.url).searchParams.get("arquivo");
  if (arquivo !== "perguntas" && arquivo !== "posicoes") return json(400, { erro: "Arquivo inválido." });

  const registros = await lerRascunhos(db());
  const rascunhos = Object.fromEntries(Object.entries(registros).map(([id, r]) => [id, r.rascunho]));
  const saida = aplicarRascunhos({ questions: questionsFile, positions: positionsFile }, rascunhos, hojeEmBrasilia());
  const problemas = validarArquivos(saida);
  if (problemas.length > 0) return json(422, { erro: "Os arquivos não passaram na validação.", problemas });

  await registrar(db(), a.usuario, "exportou-revisao", ARQUIVOS[arquivo]);
  return new Response(serializarArquivo(arquivo === "perguntas" ? saida.questions : saida.positions), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ARQUIVOS[arquivo]}"`,
      "Cache-Control": "no-store",
    },
  });
}
