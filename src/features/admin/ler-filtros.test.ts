import { describe, expect, it } from "vitest";
import { lerFiltros, lerMetrica, urlPainel } from "./ler-filtros";

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

describe("urlPainel e lerMetrica", () => {
  it("monta a URL só com os filtros presentes, na ordem fixa", () => {
    expect(urlPainel({})).toBe("/admin/");
    expect(urlPainel({ uf: "SP", municipio: 3550308, genero: "mulher", faixa: "25-34", metrica: "participacoes" })).toBe(
      "/admin/?uf=SP&municipio=3550308&genero=mulher&faixa=25-34&metrica=participacoes",
    );
    expect(urlPainel({ municipio: 3550308, metrica: "afinidade" })).toBe("/admin/");
  });

  it("lê a métrica do mapa, com afinidade como padrão", () => {
    expect(lerMetrica({ metrica: "participacoes" })).toBe("participacoes");
    expect(lerMetrica({ metrica: "x" })).toBe("afinidade");
    expect(lerMetrica({})).toBe("afinidade");
  });
});
