import { cookies } from "next/headers";
import { db } from "@/server/db/client";
import { json, origemValida } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { COOKIE_ADMIN, encerrarSessao, validarSessao } from "@/server/services/sessoes";

export async function POST(req: Request) {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });
  const jar = await cookies();
  const token = jar.get(COOKIE_ADMIN)?.value;
  const usuario = await validarSessao(db(), token);
  if (usuario) await registrar(db(), usuario, "saiu");
  await encerrarSessao(db(), token);
  jar.delete(COOKIE_ADMIN);
  return json(200, { ok: true });
}
