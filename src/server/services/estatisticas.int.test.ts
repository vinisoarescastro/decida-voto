import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { computeAffinity } from "@/lib/affinity";
import { criarDbDeTeste, limpar } from "../test/db";
import { base, CANDIDATOS, entrada, respostasComValor } from "../test/fixtures";
import { calcularEstatisticas } from "./estatisticas";
import { registrarParticipacao } from "./participacoes";

const { db, fechar } = criarDbDeTeste();
const LIMITE = 10;
const [A, B] = CANDIDATOS;
const pontos = (valor: number) => computeAffinity(base.questions, base.candidates, base.positions, respostasComValor(valor)).scores;

beforeAll(async () => {
  await limpar(db);
  const lote = [
    // 12 em São Paulo/SP, homens de 25–34, todos com valor 1
    ...Array.from({ length: 12 }, () => entrada({ uf: "SP", municipio: 3550308, genero: "homem", idade: 30 }, 1)),
    // 10 no Rio de Janeiro/RJ, mulheres de 45–59, todas com valor 4
    ...Array.from({ length: 10 }, () => entrada({ uf: "RJ", municipio: 3304557, genero: "mulher", idade: 50 }, 4)),
    // 3 em Salvador/BA (grupo pequeno: deve ficar oculto)
    ...Array.from({ length: 3 }, () => entrada({ uf: "BA", municipio: 2927408, genero: "homem", idade: 20 }, 2)),
  ];
  for (const e of lote) await registrarParticipacao(db, e, base);
});
afterAll(async () => {
  await limpar(db);
  await fechar();
});

describe("calcularEstatisticas", () => {
  it("calcula total e média geral, com pontos somando 100", async () => {
    const s = await calcularEstatisticas(db, CANDIDATOS, {}, LIMITE);
    expect(s.total).toBe(25);
    expect(s.geral![A] + s.geral![B]).toBeCloseTo(100, 3);
    const esperadoA = (12 * pontos(1)[0].share + 10 * pontos(4)[0].share + 3 * pontos(2)[0].share) / 25;
    expect(s.geral![A]).toBeCloseTo(esperadoA, 3);
  });

  it("oculta grupos com menos participações que o limite e informa quantos foram ocultados", async () => {
    const s = await calcularEstatisticas(db, CANDIDATOS, {}, LIMITE);
    expect(s.porUf.grupos.map((g) => g.chave)).toEqual(["SP", "RJ"]);
    expect(s.porUf.ocultos).toBe(1);
    expect(JSON.stringify(s)).not.toContain("BA");
    expect(s.porMunicipio.grupos.map((g) => g.rotulo)).toEqual(["São Paulo", "Rio de Janeiro"]);
    expect(s.porFaixa.grupos.map((g) => g.chave)).toEqual(["25-34", "45-59"]);
    expect(s.porFaixa.ocultos).toBe(1);
  });

  it("calcula a média por grupo e a proporção sobre o total filtrado", async () => {
    const s = await calcularEstatisticas(db, CANDIDATOS, {}, LIMITE);
    const sp = s.porUf.grupos.find((g) => g.chave === "SP")!;
    expect(sp.participacoes).toBe(12);
    expect(sp.proporcao).toBeCloseTo(12 / 25);
    expect(sp.pontos[A]).toBeCloseTo(pontos(1)[0].share, 3);
    expect(sp.pontos[B]).toBeCloseTo(pontos(1)[1].share, 3);
  });

  it("aplica filtros combinados (cruzamento)", async () => {
    const mulheres = await calcularEstatisticas(db, CANDIDATOS, { genero: "mulher" }, LIMITE);
    expect(mulheres.total).toBe(10);
    expect(mulheres.porUf.grupos.map((g) => g.chave)).toEqual(["RJ"]);
    expect(mulheres.porGenero.grupos.map((g) => g.chave)).toEqual(["mulher"]);

    const spHomens = await calcularEstatisticas(db, CANDIDATOS, { uf: "SP", genero: "homem", faixa: "25-34", municipio: 3550308 }, LIMITE);
    expect(spHomens.total).toBe(12);
  });

  it("oculta tudo quando o recorte filtrado tem menos participações que o limite", async () => {
    const ba = await calcularEstatisticas(db, CANDIDATOS, { uf: "BA" }, LIMITE);
    expect(ba).toMatchObject({ total: null, geral: null });
    expect(ba.porUf.grupos).toHaveLength(0);
  });
});
