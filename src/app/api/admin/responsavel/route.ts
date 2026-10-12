import { errosDoResponsavel, responsavelSchema } from "@/lib/responsavel";
import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { json, lerJson } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { salvarResponsavel } from "@/server/services/responsavel";

/** Atualiza o responsável pelos dados exibido nas páginas públicas. Só master. */
export async function POST(req: Request) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;

  const corpo = responsavelSchema.safeParse(await lerJson(req, 2048));
  if (!corpo.success) return json(400, { erro: "Confira os campos destacados.", campos: errosDoResponsavel(corpo.error) });

  await salvarResponsavel(db(), corpo.data);
  await registrar(db(), a.usuario, "alterou-responsavel");
  return json(200, { ok: true, responsavel: corpo.data });
}
