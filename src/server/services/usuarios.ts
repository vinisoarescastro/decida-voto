import { and, asc, count, eq, ne, or } from "drizzle-orm";
import { VALIDADE_PROVISORIA_MS, type EdicaoUsuario, type NovoUsuario, type Papel } from "@/lib/admin-usuarios";
import { adminUsuarios } from "../db/schema";
import type { AnyDb } from "../db/types";
import { gerarHashSenha, gerarSenhaProvisoria, iguaisEmTempoConstante, verificarSenha } from "../security/crypto";
import { encerrarSessoesDoUsuario } from "./sessoes";

// Usuários do painel. Regras centrais:
// - só o master altera (as rotas conferem o papel antes de chamar estas funções);
// - nunca fica sem master ativo; ninguém muda o próprio nível, se desativa, se exclui ou reseta a própria senha;
// - senha provisória: gerada aqui, devolvida uma única vez, nunca gravada em texto; vale 24 horas.

/** Regra de negócio violada; a mensagem vai para a tela. */
export class ErroUsuario extends Error {
  constructor(
    mensagem: string,
    readonly campo?: string,
    readonly status = 400,
  ) {
    super(mensagem);
  }
}

export type UsuarioLista = {
  id: string;
  usuario: string;
  nome: string;
  email: string | null;
  papel: Papel;
  ativo: boolean;
  senhaProvisoria: boolean;
  provisoriaExpiraEm: Date | null;
  criadoEm: Date;
  ultimoAcessoEm: Date | null;
};

const COLUNAS_LISTA = {
  id: adminUsuarios.id,
  usuario: adminUsuarios.usuario,
  nome: adminUsuarios.nome,
  email: adminUsuarios.email,
  papel: adminUsuarios.papel,
  ativo: adminUsuarios.ativo,
  senhaProvisoria: adminUsuarios.senhaProvisoria,
  provisoriaExpiraEm: adminUsuarios.provisoriaExpiraEm,
  criadoEm: adminUsuarios.criadoEm,
  ultimoAcessoEm: adminUsuarios.ultimoAcessoEm,
};

export async function listarUsuarios(db: AnyDb): Promise<UsuarioLista[]> {
  return db.select(COLUNAS_LISTA).from(adminUsuarios).orderBy(asc(adminUsuarios.nome), asc(adminUsuarios.usuario));
}

async function buscar(db: AnyDb, id: string) {
  const [u] = await db.select().from(adminUsuarios).where(eq(adminUsuarios.id, id));
  if (!u) throw new ErroUsuario("Usuário não encontrado.", undefined, 404);
  return u;
}

/** Quantos masters ativos existem além de `exceto`. */
async function outrosMastersAtivos(db: AnyDb, exceto: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(adminUsuarios)
    .where(and(eq(adminUsuarios.papel, "master"), eq(adminUsuarios.ativo, true), ne(adminUsuarios.id, exceto)));
  return Number(r?.n ?? 0);
}

async function conferirDuplicados(db: AnyDb, usuario: string | null, email: string | null, exceto?: string) {
  if (usuario) {
    const [u] = await db.select({ id: adminUsuarios.id }).from(adminUsuarios).where(eq(adminUsuarios.usuario, usuario));
    if (u && u.id !== exceto) throw new ErroUsuario("Já existe alguém com este nome de usuário.", "usuario", 409);
  }
  if (email) {
    const [u] = await db.select({ id: adminUsuarios.id }).from(adminUsuarios).where(eq(adminUsuarios.email, email));
    if (u && u.id !== exceto) throw new ErroUsuario("Este e-mail já está em uso por outra pessoa.", "email", 409);
  }
}

const novaProvisoria = async (agora: Date) => {
  const senha = gerarSenhaProvisoria();
  return {
    senha,
    campos: {
      senhaHash: await gerarHashSenha(senha),
      senhaProvisoria: true,
      provisoriaExpiraEm: new Date(agora.getTime() + VALIDADE_PROVISORIA_MS),
    },
  };
};

/** Cria a pessoa com senha provisória. A senha volta só nesta resposta, para o master repassar. */
export async function criarUsuario(db: AnyDb, dados: NovoUsuario, agora: Date = new Date()) {
  await conferirDuplicados(db, dados.usuario, dados.email);
  const { senha, campos } = await novaProvisoria(agora);
  const [criado] = await db
    .insert(adminUsuarios)
    .values({ usuario: dados.usuario, nome: dados.nome, email: dados.email, papel: dados.papel, ...campos, criadoEm: agora, atualizadoEm: agora })
    .returning(COLUNAS_LISTA);
  return { usuario: criado, senhaProvisoria: senha };
}

export async function editarUsuario(db: AnyDb, id: string, dados: EdicaoUsuario, autorId: string, agora: Date = new Date()) {
  const atual = await buscar(db, id);
  const mudouAcesso = atual.papel !== dados.papel || atual.ativo !== dados.ativo;
  if (id === autorId && mudouAcesso) throw new ErroUsuario("Você não pode mudar o seu próprio nível de acesso nem se desativar.");
  const deixaDeSerMasterAtivo = atual.papel === "master" && atual.ativo && (dados.papel !== "master" || !dados.ativo);
  if (deixaDeSerMasterAtivo && (await outrosMastersAtivos(db, id)) === 0) {
    throw new ErroUsuario("É preciso ter pelo menos um master ativo. Promova outra pessoa antes.");
  }
  await conferirDuplicados(db, null, dados.email, id);
  const [salvo] = await db
    .update(adminUsuarios)
    .set({ nome: dados.nome, email: dados.email, papel: dados.papel, ativo: dados.ativo, atualizadoEm: agora })
    .where(eq(adminUsuarios.id, id))
    .returning(COLUNAS_LISTA);
  // Novo nível ou desativação valem na hora: a pessoa entra de novo (ou não entra mais).
  if (mudouAcesso) await encerrarSessoesDoUsuario(db, id);
  return { antes: atual, depois: salvo };
}

/** Gera nova senha provisória (24 h) e derruba as sessões abertas da pessoa. */
export async function resetarSenha(db: AnyDb, id: string, autorId: string, agora: Date = new Date()) {
  if (id === autorId) throw new ErroUsuario("Para trocar a sua própria senha, use “Alterar minha senha”.");
  const alvo = await buscar(db, id);
  const { senha, campos } = await novaProvisoria(agora);
  await db.update(adminUsuarios).set({ ...campos, atualizadoEm: agora }).where(eq(adminUsuarios.id, id));
  await encerrarSessoesDoUsuario(db, id);
  return { usuario: alvo.usuario, senhaProvisoria: senha };
}

export async function excluirUsuario(db: AnyDb, id: string, autorId: string) {
  if (id === autorId) throw new ErroUsuario("Você não pode excluir o seu próprio usuário.");
  const alvo = await buscar(db, id);
  if (alvo.papel === "master" && alvo.ativo && (await outrosMastersAtivos(db, id)) === 0) {
    throw new ErroUsuario("É preciso ter pelo menos um master ativo.");
  }
  await db.delete(adminUsuarios).where(eq(adminUsuarios.id, id)); // as sessões caem junto (on delete cascade)
  return alvo;
}

/** Troca a senha da própria pessoa (obrigatória após a provisória). Encerra as outras sessões dela. */
export async function trocarSenha(db: AnyDb, id: string, senhaAtual: string, novaSenha: string, tokenAtual?: string, agora: Date = new Date()) {
  const u = await buscar(db, id);
  if (!(await verificarSenha(senhaAtual, u.senhaHash))) throw new ErroUsuario("A senha atual não confere.", "senhaAtual");
  await db
    .update(adminUsuarios)
    .set({ senhaHash: await gerarHashSenha(novaSenha), senhaProvisoria: false, provisoriaExpiraEm: null, atualizadoEm: agora })
    .where(eq(adminUsuarios.id, id));
  await encerrarSessoesDoUsuario(db, id, tokenAtual);
}

export type ResultadoLogin =
  | { ok: true; usuario: { id: string; usuario: string } }
  | { ok: false; motivo: "invalido" | "provisoria-vencida"; usuario?: { id: string; usuario: string } };

/**
 * Confere usuário (ou e-mail) e senha. Com a tabela vazia, a conta do .env (ADMIN_USERNAME e
 * ADMIN_PASSWORD_HASH) entra uma única vez e vira o primeiro master; depois disso o .env não vale mais.
 * A senha é sempre verificada, mesmo sem usuário, para o tempo de resposta não revelar quem existe.
 */
export async function autenticar(
  db: AnyDb,
  identificador: string,
  senha: string,
  contaInicial: { usuario: string; senhaHash: string },
  agora: Date = new Date(),
): Promise<ResultadoLogin> {
  const id = identificador.trim().toLowerCase();
  const [u] = await db
    .select()
    .from(adminUsuarios)
    .where(or(eq(adminUsuarios.usuario, id), eq(adminUsuarios.email, id)))
    .limit(1);

  if (!u) {
    const senhaInicialOk = await verificarSenha(senha, contaInicial.senhaHash);
    const [{ n }] = await db.select({ n: count() }).from(adminUsuarios);
    const usuarioInicial = contaInicial.usuario.trim().toLowerCase();
    if (Number(n) > 0 || !senhaInicialOk || !iguaisEmTempoConstante(id, usuarioInicial)) return { ok: false, motivo: "invalido" };
    await db
      .insert(adminUsuarios)
      .values({ usuario: usuarioInicial, nome: "Administrador", papel: "master", senhaHash: contaInicial.senhaHash, criadoEm: agora, atualizadoEm: agora })
      .onConflictDoNothing();
    const [criado] = await db.select({ id: adminUsuarios.id, usuario: adminUsuarios.usuario }).from(adminUsuarios).where(eq(adminUsuarios.usuario, usuarioInicial));
    return { ok: true, usuario: criado };
  }

  const quem = { id: u.id, usuario: u.usuario };
  if (!(await verificarSenha(senha, u.senhaHash))) return { ok: false, motivo: "invalido", usuario: quem };
  if (!u.ativo) return { ok: false, motivo: "invalido" };
  if (u.senhaProvisoria && u.provisoriaExpiraEm && u.provisoriaExpiraEm <= agora) return { ok: false, motivo: "provisoria-vencida", usuario: quem };
  await db.update(adminUsuarios).set({ ultimoAcessoEm: agora }).where(eq(adminUsuarios.id, u.id));
  return { ok: true, usuario: quem };
}
