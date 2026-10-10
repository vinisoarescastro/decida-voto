import { describe, expect, it } from "vitest";
import { lerFiltros } from "./ler-filtros";

describe("lerFiltros (painel)", () => {
  it("aceita filtros válidos combinados", () => {
    expect(lerFiltros({ uf: "SP", municipio: "3550308", genero: "mulher", faixa: "25-34" })).toEqual({
      uf: "SP",
      municipio: 3550308,
      genero: "mulher",
      faixa: "25-34",
    });
  });

  it("ignora valores desconhecidos e tentativas de injeção", () => {
    expect(lerFiltros({ uf: "XX", genero: "'; drop table participacoes", faixa: "99", extra: "1" })).toEqual({});
  });

  it("ignora município de outra UF ou sem UF", () => {
    expect(lerFiltros({ uf: "RJ", municipio: "3550308" })).toEqual({ uf: "RJ" });
    expect(lerFiltros({ municipio: "3550308" })).toEqual({});
  });

  it("ignora parâmetros repetidos (arrays)", () => {
    expect(lerFiltros({ uf: ["SP", "RJ"] })).toEqual({});
  });
});
