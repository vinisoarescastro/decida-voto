import { errosPorCampo, novoUsuarioSchema, rotuloPapel } from "@/lib/admin-usuarios";
import { autorizarApi } from "@/server/auth";
import { db } from "@/server/db/client";
import { json, lerJson } from "@/server/http";
import { registrar } from "@/server/services/auditoria";
import { criarUsuario, ErroUsuario } from "@/server/services/usuarios";

/** Cria um usuário (só master): { usuario, nome, email, papel }. Devolve a senha provisória uma única vez. */
export async function POST(req: Request) {
  const a = await autorizarApi(req, { escrita: true });
  if (a.negado) return a.negado;

  const corpo = novoUsuarioSchema.safeParse(await lerJson(req, 4096));
  if (!corpo.success) return json(400, { erro: "Confira os campos destacados.", campos: errosPorCampo(corpo.error) });

  try {
    const { usuario, senhaProvisoria } = await criarUsuario(db(), corpo.data);
    await registrar(db(), a.usuario, "criou-usuario", `${usuario.usuario} (${rotuloPapel(usuario.papel)})`);
    return json(201, { ok: true, usuario, senhaProvisoria });
  } catch (e) {
    if (e instanceof ErroUsuario) return json(e.status, { erro: e.message, campos: e.campo ? { [e.campo]: e.message } : undefined });
    throw e;
  }
}
