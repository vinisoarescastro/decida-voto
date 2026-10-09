import { describe, expect, it } from "vitest";
import { emitirToken, gerarHashSenha, hashDiario, iguaisEmTempoConstante, verificarSenha, verificarToken } from "./crypto";

const SEGREDO = "s".repeat(40);

describe("hashDiario", () => {
  const dia1 = new Date("2026-10-10T12:00:00Z");
  const dia2 = new Date("2026-10-11T12:00:00Z");

  it("é estável no mesmo dia e escopo", () => {
    expect(hashDiario(SEGREDO, "x", "203.0.113.5", dia1)).toBe(hashDiario(SEGREDO, "x", "203.0.113.5", new Date("2026-10-10T23:59:00Z")));
  });

  it("muda no dia seguinte e entre escopos, sem revelar o IP", () => {
    const h = hashDiario(SEGREDO, "x", "203.0.113.5", dia1);
    expect(h).not.toBe(hashDiario(SEGREDO, "x", "203.0.113.5", dia2));
    expect(h).not.toBe(hashDiario(SEGREDO, "y", "203.0.113.5", dia1));
    expect(h).not.toContain("203");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("token de questionário", () => {
  const t0 = Date.parse("2026-10-10T12:00:00Z");
  const opcoes = { minimoSegundos: 15, maximoSegundos: 7200 };

  it("é aceito dentro da janela de tempo", () => {
    const token = emitirToken(SEGREDO, t0);
    const r = verificarToken(SEGREDO, token, { ...opcoes, agora: t0 + 60_000 });
    expect(r.ok).toBe(true);
  });

  it("recusa envio rápido demais (comportamento de robô) e token expirado", () => {
    const token = emitirToken(SEGREDO, t0);
    expect(verificarToken(SEGREDO, token, { ...opcoes, agora: t0 + 3_000 })).toEqual({ ok: false, motivo: "rapido-demais" });
    expect(verificarToken(SEGREDO, token, { ...opcoes, agora: t0 + 3 * 3600_000 })).toEqual({ ok: false, motivo: "expirado" });
  });

  it("recusa token adulterado ou assinado com outro segredo", () => {
    const token = emitirToken(SEGREDO, t0);
    const [payload, assinatura] = token.split(".");
    const adulterado = Buffer.from(JSON.stringify({ n: "x", t: t0 - 3600_000 })).toString("base64url");
    expect(verificarToken(SEGREDO, `${adulterado}.${assinatura}`, { ...opcoes, agora: t0 + 60_000 }).ok).toBe(false);
    expect(verificarToken("o".repeat(40), token, { ...opcoes, agora: t0 + 60_000 }).ok).toBe(false);
    expect(verificarToken(SEGREDO, payload, { ...opcoes, agora: t0 + 60_000 })).toEqual({ ok: false, motivo: "formato" });
  });

  it("gera nonces diferentes a cada emissão", () => {
    expect(emitirToken(SEGREDO, t0)).not.toBe(emitirToken(SEGREDO, t0));
  });
});

describe("senha do administrador (scrypt)", () => {
  it("verifica a senha correta e recusa a errada", async () => {
    const hash = await gerarHashSenha("senha-forte-de-teste");
    expect(hash).toMatch(/^scrypt:131072:8:1:/);
    expect(hash).not.toContain("senha-forte-de-teste");
    expect(await verificarSenha("senha-forte-de-teste", hash)).toBe(true);
    expect(await verificarSenha("senha-errada", hash)).toBe(false);
  });

  it("recusa hash malformado", async () => {
    expect(await verificarSenha("x", "md5:abc")).toBe(false);
  });
});

describe("iguaisEmTempoConstante", () => {
  it("compara valores de tamanhos diferentes sem falhar", () => {
    expect(iguaisEmTempoConstante("admin", "admin")).toBe(true);
    expect(iguaisEmTempoConstante("admin", "administrador")).toBe(false);
  });
});
