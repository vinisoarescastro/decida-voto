import { cookies } from "next/headers";
import { positionsFile, questionsFile } from "@/lib/data";
import { aplicarRascunhos, hojeEmBrasilia, serializarArquivo, validarArquivos } from "@/lib/revisao";
import { db } from "@/server/db/client";
import { json } from "@/server/http";
import { lerRascunhos } from "@/server/services/revisao";
import { COOKIE_ADMIN, validarSessao } from "@/server/services/sessoes";

const ARQUIVOS = { perguntas: "questions.json", posicoes: "positions.json" } as const;

/**
 * Baixa questions.json ou positions.json com os rascunhos aplicados (?arquivo=perguntas|posicoes).
 * Para publicar, o arquivo substitui o de src/data e passa pelos testes e pelo build.
 */
export async function GET(req: Request) {
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!(await validarSessao(db(), token))) return json(401, { erro: "Sua sessão expirou. Entre novamente." });

  const arquivo = new URL(req.url).searchParams.get("arquivo");
  if (arquivo !== "perguntas" && arquivo !== "posicoes") return json(400, { erro: "Arquivo inválido." });

  const registros = await lerRascunhos(db());
  const rascunhos = Object.fromEntries(Object.entries(registros).map(([id, r]) => [id, r.rascunho]));
  const saida = aplicarRascunhos({ questions: questionsFile, positions: positionsFile }, rascunhos, hojeEmBrasilia());
  const problemas = validarArquivos(saida);
  if (problemas.length > 0) return json(422, { erro: "Os arquivos não passaram na validação.", problemas });

  return new Response(serializarArquivo(arquivo === "perguntas" ? saida.questions : saida.positions), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ARQUIVOS[arquivo]}"`,
      "Cache-Control": "no-store",
    },
  });
}
