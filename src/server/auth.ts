import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db/client";
import { json, origemValida } from "./http";
import { registrarVisualizacao } from "./services/auditoria";
import { COOKIE_ADMIN, validarSessao, type UsuarioSessao } from "./services/sessoes";

// Controle de acesso do painel. Toda página e toda rota de API passam por aqui:
// - sem sessão válida: login;
// - com senha provisória: só a tela de nova senha (o resto fica bloqueado até a troca);
// - alterações: só o master (o admin só visualiza; a recusa vale no servidor, não só na tela).

export const ROTA_NOVA_SENHA = "/admin/nova-senha/";

/**
 * Garante sessão válida numa página do painel e devolve quem está logado. `tela` registra a visualização
 * na auditoria. Com senha provisória, manda para a troca de senha.
 */
export async function exigirAdmin({ tela, permitirProvisoria = false }: { tela?: string; permitirProvisoria?: boolean } = {}): Promise<UsuarioSessao> {
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  const usuario = await validarSessao(db(), token);
  if (!usuario) redirect("/admin/login/");
  if (usuario.senhaProvisoria && !permitirProvisoria) redirect(ROTA_NOVA_SENHA);
  if (tela) await registrarVisualizacao(db(), usuario, tela);
  return usuario;
}

type Opcoes = {
  /** Rota que altera dados: exige origem do próprio site e, salvo `todos`, papel master. */
  escrita?: boolean;
  /** Na escrita, libera também o admin (ex.: trocar a própria senha). */
  todos?: boolean;
  /** Libera quem ainda está com senha provisória (só a troca de senha e a saída). */
  permitirProvisoria?: boolean;
};

/** Autoriza uma rota de API do painel. Devolve quem está logado ou a resposta de recusa. */
export async function autorizarApi(req: Request, { escrita = false, todos = false, permitirProvisoria = false }: Opcoes = {}): Promise<
  { usuario: UsuarioSessao; token: string; negado?: undefined } | { negado: Response }
> {
  if (escrita && !origemValida(req)) return { negado: json(403, { erro: "Origem não permitida." }) };
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  const usuario = await validarSessao(db(), token);
  if (!usuario || !token) return { negado: json(401, { erro: "Sua sessão expirou. Entre novamente." }) };
  if (usuario.senhaProvisoria && !permitirProvisoria) return { negado: json(403, { erro: "Defina uma nova senha antes de continuar." }) };
  if (escrita && !todos && usuario.papel !== "master") {
    return { negado: json(403, { erro: "Seu acesso é só de visualização. Peça a um master para fazer esta alteração." }) };
  }
  return { usuario, token };
}
