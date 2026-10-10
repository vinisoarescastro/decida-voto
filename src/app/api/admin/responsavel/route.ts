import { cookies } from "next/headers";
import { errosDoResponsavel, responsavelSchema } from "@/lib/responsavel";
import { db } from "@/server/db/client";
import { json, lerJson, origemValida } from "@/server/http";
import { salvarResponsavel } from "@/server/services/responsavel";
import { COOKIE_ADMIN, validarSessao } from "@/server/services/sessoes";

/** Atualiza o responsável pelos dados exibido nas páginas públicas. Exige sessão do painel. */
export async function POST(req: Request) {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!(await validarSessao(db(), token))) return json(401, { erro: "Sua sessão expirou. Entre novamente." });

  const corpo = responsavelSchema.safeParse(await lerJson(req, 2048));
  if (!corpo.success) return json(400, { erro: "Confira os campos destacados.", campos: errosDoResponsavel(corpo.error) });

  await salvarResponsavel(db(), corpo.data);
  return json(200, { ok: true, responsavel: corpo.data });
}
