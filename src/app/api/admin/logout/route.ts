import { cookies } from "next/headers";
import { db } from "@/server/db/client";
import { json, origemValida } from "@/server/http";
import { COOKIE_ADMIN, encerrarSessao } from "@/server/services/sessoes";

export async function POST(req: Request) {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });
  const jar = await cookies();
  await encerrarSessao(db(), jar.get(COOKIE_ADMIN)?.value);
  jar.delete(COOKIE_ADMIN);
  return json(200, { ok: true });
}
