import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adminSessoes, limitesRequisicao } from "../db/schema";
import { consumir } from "../security/rate-limit";
import { criarDbDeTeste, limpar } from "../test/db";
import { criarSessao, encerrarSessao, SESSAO_MAXIMA_MS, SESSAO_OCIOSA_MS, validarSessao } from "./sessoes";
import { consumirNonce } from "./tokens";

const { db, fechar } = criarDbDeTeste();
beforeEach(() => limpar(db));
afterAll(() => fechar());

const regra = { escopo: "teste", limite: 3, janelaSegundos: 60 };
const agora = new Date("2026-10-10T12:00:10Z");

describe("limite de requisições", () => {
  it("permite até o limite e bloqueia a partir daí, com tempo de espera", async () => {
    const r = [];
    for (let i = 0; i < 4; i++) r.push(await consumir(db, regra, "a".repeat(64), agora));
    expect(r.map((x) => x.permitido)).toEqual([true, true, true, false]);
    expect(r[3].tentarAposSegundos).toBe(50);
  });

  it("conta chaves separadamente e reinicia na janela seguinte", async () => {
    for (let i = 0; i < 3; i++) await consumir(db, regra, "a".repeat(64), agora);
    expect((await consumir(db, regra, "b".repeat(64), agora)).permitido).toBe(true);
    expect((await consumir(db, regra, "a".repeat(64), new Date(agora.getTime() + 60_000))).permitido).toBe(true);
  });

  it("grava apenas o hash recebido, nunca o IP", async () => {
    await consumir(db, regra, "c".repeat(64), agora);
    const [linha] = await db.select().from(limitesRequisicao);
    expect(linha.chaveHash).toBe("c".repeat(64));
  });
});

describe("token de questionário de uso único", () => {
  it("aceita o primeiro uso e recusa a reutilização", async () => {
    const expira = new Date(Date.now() + 3600_000);
    expect(await consumirNonce(db, "nonce-1", expira)).toBe(true);
    expect(await consumirNonce(db, "nonce-1", expira)).toBe(false);
    expect(await consumirNonce(db, "nonce-2", expira)).toBe(true);
  });
});

describe("sessões do painel", () => {
  it("valida uma sessão recém-criada e guarda só o hash do token", async () => {
    const token = await criarSessao(db, agora);
    expect(await validarSessao(db, token, new Date(agora.getTime() + 60_000))).toBe(true);
    const [s] = await db.select().from(adminSessoes);
    expect(s.tokenHash).not.toBe(token);
    expect(s.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("recusa token desconhecido ou ausente", async () => {
    expect(await validarSessao(db, undefined)).toBe(false);
    expect(await validarSessao(db, "inexistente")).toBe(false);
  });

  it("encerra por inatividade e por tempo máximo", async () => {
    const ociosa = await criarSessao(db, agora);
    expect(await validarSessao(db, ociosa, new Date(agora.getTime() + SESSAO_OCIOSA_MS + 1000))).toBe(false);

    const longa = await criarSessao(db, agora);
    let t = agora.getTime();
    // uso contínuo a cada 20 min não ultrapassa o limite máximo de 8 h
    while (t + 20 * 60_000 < agora.getTime() + SESSAO_MAXIMA_MS) {
      t += 20 * 60_000;
      expect(await validarSessao(db, longa, new Date(t))).toBe(true);
    }
    expect(await validarSessao(db, longa, new Date(agora.getTime() + SESSAO_MAXIMA_MS + 1000))).toBe(false);
  });

  it("encerra a sessão no logout", async () => {
    const token = await criarSessao(db, agora);
    await encerrarSessao(db, token);
    expect(await validarSessao(db, token, agora)).toBe(false);
  });
});
