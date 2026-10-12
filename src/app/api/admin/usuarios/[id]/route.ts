import { edicaoUsuarioSchema, errosPorCampo, rotuloPapel } from "@/lib/admin-usuarios";
import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { json, lerJson } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { editarUsuario, ErroUsuario, excluirUsuario } from "@/server/services/usuarios";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const erro = (e: unknown) => {
  if (e instanceof ErroUsuario) return json(e.status, { erro: e.message, campos: e.campo ? { [e.campo]: e.message } : undefined });
  throw e;
};

/** Edita nome, e-mail, nível e situação (só master). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/usuarios/[id]">) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json(404, { erro: "Usuário não encontrado." });

  const corpo = edicaoUsuarioSchema.safeParse(await lerJson(req, 4096));
  if (!corpo.success) return json(400, { erro: "Confira os campos destacados.", campos: errosPorCampo(corpo.error) });

  try {
    const { antes, depois } = await editarUsuario(db(), id, corpo.data, a.usuario.id);
    const mudancas = [
      antes.nome !== depois.nome && "nome",
      antes.email !== depois.email && "e-mail",
      antes.papel !== depois.papel && `nível: ${rotuloPapel(depois.papel)}`,
      antes.ativo !== depois.ativo && (depois.ativo ? "reativado" : "desativado"),
    ].filter(Boolean);
    if (mudancas.length) await registrar(db(), a.usuario, "editou-usuario", `${depois.usuario} (${mudancas.join(", ")})`);
    return json(200, { ok: true, usuario: depois });
  } catch (e) {
    return erro(e);
  }
}

/** Exclui o usuário (só master). O histórico da auditoria continua, com o nome de usuário da época. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/usuarios/[id]">) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json(404, { erro: "Usuário não encontrado." });

  try {
    const alvo = await excluirUsuario(db(), id, a.usuario.id);
    await registrar(db(), a.usuario, "excluiu-usuario", alvo.usuario);
    return json(200, { ok: true });
  } catch (e) {
    return erro(e);
  }
}
