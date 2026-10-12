import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminAuditoria, adminSessoes, adminUsuarios } from "../db/schema";
import { gerarHashSenha, verificarSenha } from "../security/crypto";
import { criarDbDeTeste, limpar } from "../test/db";
import { INTERVALO_VISUALIZACAO_MS, listarAuditoria, registrarVisualizacao } from "./auditoria";
import { criarSessao, validarSessao } from "./sessoes";
import { autenticar, criarUsuario, editarUsuario, ErroUsuario, excluirUsuario, resetarSenha, trocarSenha } from "./usuarios";

const { db, fechar } = criarDbDeTeste();
const agora = new Date("2026-10-12T15:00:00Z");
let contaInicial = { usuario: "Admin-Inicial", senhaHash: "" };

beforeAll(async () => {
  contaInicial = { usuario: "Admin-Inicial", senhaHash: await gerarHashSenha("senha-inicial-do-env") };
});
beforeEach(() => limpar(db));
afterAll(() => fechar());

async function master() {
  const r = await autenticar(db, "admin-inicial", "senha-inicial-do-env", contaInicial, agora);
  if (!r.ok) throw new Error("bootstrap falhou");
  return r.usuario;
}

describe("entrada no painel", () => {
  it("com a tabela vazia, a conta do .env entra uma vez e vira o primeiro master", async () => {
    expect((await autenticar(db, "admin-inicial", "errada", contaInicial, agora)).ok).toBe(false);
    const r = await autenticar(db, "ADMIN-INICIAL", "senha-inicial-do-env", contaInicial, agora);
    expect(r.ok).toBe(true);
    const [u] = await db.select().from(adminUsuarios);
    expect(u).toMatchObject({ usuario: "admin-inicial", papel: "master", senhaProvisoria: false });
  });

  it("depois que existem usuários, o .env não vale mais para quem não está no banco", async () => {
    const m = await master();
    await db.update(adminUsuarios).set({ usuario: "outro-nome" }).where(eq(adminUsuarios.id, m.id));
    expect((await autenticar(db, "admin-inicial", "senha-inicial-do-env", contaInicial, agora)).ok).toBe(false);
  });

  it("entra com usuário ou e-mail; recusa senha errada e usuário desativado", async () => {
    await master();
    const { usuario, senhaProvisoria } = await criarUsuario(db, { usuario: "ana", nome: "Ana", email: "ana@exemplo.org", papel: "admin" }, agora);
    expect((await autenticar(db, "ana", senhaProvisoria, contaInicial, agora)).ok).toBe(true);
    expect((await autenticar(db, "ANA@exemplo.org", senhaProvisoria, contaInicial, agora)).ok).toBe(true);
    const errada = await autenticar(db, "ana", "errada", contaInicial, agora);
    expect(errada).toMatchObject({ ok: false, motivo: "invalido", usuario: { id: usuario.id } });
    await db.update(adminUsuarios).set({ ativo: false }).where(eq(adminUsuarios.id, usuario.id));
    expect(await autenticar(db, "ana", senhaProvisoria, contaInicial, agora)).toEqual({ ok: false, motivo: "invalido" });
  });

  it("a senha provisória vence em 24 horas", async () => {
    await master();
    const { senhaProvisoria } = await criarUsuario(db, { usuario: "bia", nome: "Bia", email: null, papel: "admin" }, agora);
    const depois = new Date(agora.getTime() + 24 * 3600_000 + 1000);
    expect(await autenticar(db, "bia", senhaProvisoria, contaInicial, depois)).toMatchObject({ ok: false, motivo: "provisoria-vencida" });
  });
});

describe("gestão de usuários", () => {
  it("cria com senha provisória (só o hash é gravado) e recusa usuário ou e-mail repetido", async () => {
    await master();
    const { usuario, senhaProvisoria } = await criarUsuario(db, { usuario: "caio", nome: "Caio", email: "caio@exemplo.org", papel: "admin" }, agora);
    expect(senhaProvisoria).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    const [linha] = await db.select().from(adminUsuarios).where(eq(adminUsuarios.id, usuario.id));
    expect(linha.senhaHash).not.toContain(senhaProvisoria);
    expect(await verificarSenha(senhaProvisoria, linha.senhaHash)).toBe(true);
    expect(linha.senhaProvisoria).toBe(true);
    expect(linha.provisoriaExpiraEm?.getTime()).toBe(agora.getTime() + 24 * 3600_000);
    await expect(criarUsuario(db, { usuario: "caio", nome: "Outro", email: null, papel: "admin" })).rejects.toMatchObject({ campo: "usuario" });
    await expect(criarUsuario(db, { usuario: "caio2", nome: "Outro", email: "caio@exemplo.org", papel: "admin" })).rejects.toMatchObject({ campo: "email" });
  });

  it("nunca deixa o painel sem master ativo e ninguém muda o próprio acesso", async () => {
    const m = await master();
    const edicao = { nome: "Administrador", email: null, papel: "admin" as const, ativo: true };
    await expect(editarUsuario(db, m.id, edicao, m.id)).rejects.toBeInstanceOf(ErroUsuario);

    const { usuario: dani } = await criarUsuario(db, { usuario: "dani", nome: "Dani", email: null, papel: "master" });
    await expect(editarUsuario(db, m.id, edicao, m.id)).rejects.toThrow(/próprio/);
    // Dani (outra master) pode rebaixar o master inicial, já que continua havendo uma master ativa.
    await editarUsuario(db, m.id, edicao, dani.id);
    await expect(editarUsuario(db, dani.id, { nome: "Dani", email: null, papel: "master", ativo: false }, m.id)).rejects.toThrow(/master ativo/);
    await expect(excluirUsuario(db, dani.id, m.id)).rejects.toThrow(/master ativo/);
    await expect(excluirUsuario(db, dani.id, dani.id)).rejects.toThrow(/próprio/);
  });

  it("mudar o nível ou desativar encerra as sessões da pessoa", async () => {
    const m = await master();
    const { usuario: edu } = await criarUsuario(db, { usuario: "edu", nome: "Edu", email: null, papel: "admin" });
    const token = await criarSessao(db, edu.id);
    await editarUsuario(db, edu.id, { nome: "Eduardo", email: null, papel: "admin", ativo: true }, m.id);
    expect(await validarSessao(db, token)).not.toBeNull(); // só o nome mudou
    await editarUsuario(db, edu.id, { nome: "Eduardo", email: null, papel: "master", ativo: true }, m.id);
    expect(await validarSessao(db, token)).toBeNull();
  });

  it("reset gera nova provisória, invalida a senha anterior e derruba as sessões", async () => {
    const m = await master();
    const { usuario: fe, senhaProvisoria: antiga } = await criarUsuario(db, { usuario: "fe", nome: "Fe", email: null, papel: "admin" });
    await trocarSenha(db, fe.id, antiga, "uma senha nova e longa");
    const token = await criarSessao(db, fe.id);
    const { senhaProvisoria: nova } = await resetarSenha(db, fe.id, m.id, agora);
    expect(nova).not.toBe(antiga);
    expect(await validarSessao(db, token)).toBeNull();
    expect((await autenticar(db, "fe", "uma senha nova e longa", contaInicial, agora)).ok).toBe(false);
    expect((await autenticar(db, "fe", nova, contaInicial, agora)).ok).toBe(true);
    const [linha] = await db.select().from(adminUsuarios).where(eq(adminUsuarios.id, fe.id));
    expect(linha.senhaProvisoria).toBe(true);
    await expect(resetarSenha(db, m.id, m.id)).rejects.toThrow(/própria/);
  });

  it("excluir remove as sessões e mantém o histórico da auditoria", async () => {
    const m = await master();
    const { usuario: gil } = await criarUsuario(db, { usuario: "gil", nome: "Gil", email: null, papel: "admin" });
    await criarSessao(db, gil.id);
    await registrarVisualizacao(db, { id: gil.id, usuario: "gil" }, "Estatísticas");
    await excluirUsuario(db, gil.id, m.id);
    expect(await db.select().from(adminSessoes).where(eq(adminSessoes.usuarioId, gil.id))).toHaveLength(0);
    const [registro] = await db.select().from(adminAuditoria);
    expect(registro).toMatchObject({ usuario: "gil", usuarioId: null });
  });
});

describe("troca da própria senha", () => {
  it("exige a senha atual, tira a marca de provisória e encerra as outras sessões", async () => {
    await master();
    const { usuario: hel, senhaProvisoria } = await criarUsuario(db, { usuario: "hel", nome: "Hel", email: null, papel: "admin" });
    const atual = await criarSessao(db, hel.id);
    const outra = await criarSessao(db, hel.id);
    await expect(trocarSenha(db, hel.id, "errada", "nova senha bem longa")).rejects.toMatchObject({ campo: "senhaAtual" });
    await trocarSenha(db, hel.id, senhaProvisoria, "nova senha bem longa", atual);
    expect(await validarSessao(db, atual)).toMatchObject({ senhaProvisoria: false });
    expect(await validarSessao(db, outra)).toBeNull();
  });
});

describe("auditoria", () => {
  it("não repete a mesma tela em sequência, mas registra de novo depois do intervalo", async () => {
    const m = await master();
    const autor = { id: m.id, usuario: m.usuario };
    await registrarVisualizacao(db, autor, "Estatísticas", agora);
    await registrarVisualizacao(db, autor, "Estatísticas", new Date(agora.getTime() + 60_000));
    await registrarVisualizacao(db, autor, "Usuários", new Date(agora.getTime() + 60_000));
    await registrarVisualizacao(db, autor, "Estatísticas", new Date(agora.getTime() + INTERVALO_VISUALIZACAO_MS + 60_000));
    const r = await listarAuditoria(db, { usuarioId: m.id });
    expect(r.map((x) => x.detalhe)).toEqual(["Estatísticas", "Usuários", "Estatísticas"]);
  });
});
