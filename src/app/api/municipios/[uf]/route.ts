import { UF_SIGLAS } from "@/lib/perfil";
import { municipiosPorUf } from "@/server/municipios";

// Lista de municípios por UF, gerada como JSON estático no build (uma rota por UF).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return UF_SIGLAS.map((uf) => ({ uf }));
}

export async function GET(_req: Request, ctx: RouteContext<"/api/municipios/[uf]">) {
  const { uf } = await ctx.params;
  return Response.json(municipiosPorUf[uf] ?? []);
}
