import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { json } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { ErroUsuario, resetarSenha } from "@/server/services/usuarios";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reseta a senha (só master): gera nova senha provisória de 24 h, devolvida uma única vez. */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/usuarios/[id]/senha">) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json(404, { erro: "Usuário não encontrado." });

  try {
    const r = await resetarSenha(db(), id, a.usuario.id);
    await registrar(db(), a.usuario, "resetou-senha", r.usuario);
    return json(200, { ok: true, senhaProvisoria: r.senhaProvisoria });
  } catch (e) {
    if (e instanceof ErroUsuario) return json(e.status, { erro: e.message });
    throw e;
  }
}
