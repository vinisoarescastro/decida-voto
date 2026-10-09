import { describe, expect, it } from "vitest";
import { faixaEtaria, validarIdade } from "./perfil";
import { participacaoSchema, perfilSchema } from "./participacao-schema";

describe("validarIdade (frontend)", () => {
  it.each([
    ["16", 16],
    ["35", 35],
    ["120", 120],
    [" 42 ", 42],
  ])("aceita %s", (texto, idade) => {
    expect(validarIdade(texto)).toEqual({ ok: true, idade });
  });

  it.each([
    ["", "Informe sua idade."],
    ["abc", "Use apenas números inteiros"],
    ["17.5", "Use apenas números inteiros"],
    ["17,5", "Use apenas números inteiros"],
    ["-20", "Use apenas números inteiros"],
    ["1e2", "Use apenas números inteiros"],
    ["15", "A idade mínima para participar é 16 anos."],
    ["0", "A idade mínima"],
    ["121", "Informe uma idade de até 120 anos."],
  ])("rejeita %j com mensagem clara", (texto, mensagem) => {
    const r = validarIdade(texto);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain(mensagem);
  });
});

describe("perfilSchema (backend)", () => {
  const base = { uf: "SP", municipio: 3550308, genero: "mulher", idade: 30 };

  it("aceita um perfil válido", () => {
    expect(perfilSchema.safeParse(base).success).toBe(true);
  });

  it.each([15, 121, -1, 30.5, Number.NaN])("rejeita idade %s", (idade) => {
    expect(perfilSchema.safeParse({ ...base, idade }).success).toBe(false);
  });

  it("rejeita idade enviada como texto", () => {
    expect(perfilSchema.safeParse({ ...base, idade: "30" }).success).toBe(false);
  });

  it("rejeita UF, gênero e município inválidos", () => {
    expect(perfilSchema.safeParse({ ...base, uf: "XX" }).success).toBe(false);
    expect(perfilSchema.safeParse({ ...base, genero: "outro" }).success).toBe(false);
    expect(perfilSchema.safeParse({ ...base, municipio: 123 }).success).toBe(false);
  });
});

describe("participacaoSchema", () => {
  const valido = {
    perfil: { uf: "SP", municipio: 3550308, genero: "homem", idade: 40 },
    respostas: { estatais: "a" },
    consentimento: true,
    token: "x".repeat(20),
    site: "",
  };

  it("exige consentimento explícito", () => {
    expect(participacaoSchema.safeParse(valido).success).toBe(true);
    expect(participacaoSchema.safeParse({ ...valido, consentimento: false }).success).toBe(false);
  });

  it("rejeita campos extras (ex.: percentuais calculados pelo navegador)", () => {
    expect(participacaoSchema.safeParse({ ...valido, resultado: { lula: 100 } }).success).toBe(false);
  });
});

describe("faixaEtaria", () => {
  it.each([
    [16, "16-17"],
    [17, "16-17"],
    [18, "18-24"],
    [34, "25-34"],
    [44, "35-44"],
    [59, "45-59"],
    [60, "60+"],
    [120, "60+"],
  ])("idade %i → %s", (idade, faixa) => {
    expect(faixaEtaria(idade)).toBe(faixa);
  });

  it("falha fora do intervalo", () => {
    expect(() => faixaEtaria(15)).toThrow();
  });
});
