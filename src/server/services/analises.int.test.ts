import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { computeAffinity, themeAffinity } from "@/lib/affinity";
import { criarDbDeTeste, limpar } from "../test/db";
import { base, CANDIDATOS, entrada, respostasComValor } from "../test/fixtures";
import { calcularAnalises } from "./analises";
import { registrarParticipacao } from "./participacoes";

const { db, fechar } = criarDbDeTeste();
const [A, B] = CANDIDATOS;
const dados = { questions: base.questions, positions: base.positions };
const pontosA = (valor: number) =>
  computeAffinity(base.questions, base.candidates, base.positions, respostasComValor(valor)).scores.find((s) => s.candidateId === A)!.share;

beforeAll(async () => {
  await limpar(db);
  const lote = [
    ...Array.from({ length: 4 }, () => entrada({ uf: "SP", municipio: 3550308, genero: "homem", idade: 30 }, 1)),
    ...Array.from({ length: 3 }, () => entrada({ uf: "RJ", municipio: 3304557, genero: "mulher", idade: 50 }, 4)),
    { ...entrada({ uf: "SP", municipio: 3509502, genero: "mulher", idade: 20 }, 2), origem: "convite" as const }, // Campinas, por convite
  ];
  for (const e of lote) await registrarParticipacao(db, e, base);
});
afterAll(async () => {
  await limpar(db);
  await fechar();
});

describe("calcularAnalises", () => {
  it("conta as participações de hoje e dos últimos 7 dias", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, {}, 1, dados);
    expect(a.hoje).toBe(8);
    expect(a.ultimos7).toBe(8);
    expect(a.porDia).toHaveLength(1);
    expect(a.porDia[0].n).toBe(8);
  });

  it("conta para quem cada pessoa ficou mais próxima (dois grupos, acima de 50%)", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, {}, 1, dados);
    const lado = (valor: number) => (pontosA(valor) > 50 ? A : pontosA(valor) < 50 ? B : null);
    const esperado: Record<string, number> = { [A]: 0, [B]: 0 };
    for (const [valor, n] of [[1, 4], [4, 3], [2, 1]]) {
      const l = lado(valor);
      if (l) esperado[l] += n;
    }
    expect(a.maisProximos).toEqual(esperado);
    expect(a.maisProximos[A] + a.maisProximos[B] + a.empates).toBe(8);
  });

  it("conta as participações que vieram de convite", async () => {
    expect((await calcularAnalises(db, CANDIDATOS, {}, 1, dados)).convites).toBe(1);
    expect((await calcularAnalises(db, CANDIDATOS, { uf: "RJ" }, 1, dados)).convites).toBe(0);
  });

  it("distribui as participações por faixa de afinidade, somando o total", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, {}, 1, dados);
    expect(a.distribuicao).toHaveLength(10);
    expect(a.distribuicao.reduce((s, n) => s + n, 0)).toBe(8);
    expect(a.distribuicao[Math.min(9, Math.floor(pontosA(1) / 10))]).toBeGreaterThanOrEqual(4);
  });

  it("cruza gênero e faixa etária", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, {}, 1, dados);
    const homens2534 = a.cruzamento.find((c) => c.genero === "homem" && c.faixa === "25-34")!;
    expect(homens2534.n).toBe(4);
    expect(homens2534.pontosA).toBeCloseTo(pontosA(1), 3);
  });

  it("calcula a concordância por tema com as posições atuais", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, { uf: "RJ" }, 1, dados);
    const [q] = base.questions;
    const t = a.porTema.find((x) => x.perguntaId === q.id)!;
    const posA = base.positions.find((p) => p.questionId === q.id && p.candidateId === A)!;
    expect(t.n).toBe(3);
    if (posA.status === "documented") expect(t.concordancia[A]).toBeCloseTo(themeAffinity(4, posA.value) * 100, 5);
    expect(a.concordancia[B]).not.toBeNull();
  });

  it("conta quantas pessoas marcaram cada alternativa, na ordem da escala", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, {}, 1, dados);
    const [q] = base.questions;
    const r = a.respostasPorPergunta.find((x) => x.perguntaId === q.id)!;
    expect(r.total).toBe(8);
    expect(r.alternativas.map((x) => x.valor)).toEqual([1, 2, 3, 4]);
    expect(r.alternativas.map((x) => x.n)).toEqual([4, 1, 0, 3]);
    expect(r.alternativas[0].texto).toBe(q.options.find((o) => o.value === 1)!.text);
    const posA = base.positions.find((p) => p.questionId === q.id && p.candidateId === A)!;
    expect(r.posicoes[A]).toBe(posA.value);
    const rj = await calcularAnalises(db, CANDIDATOS, { uf: "RJ" }, 1, dados);
    expect(rj.respostasPorPergunta[0].alternativas.map((x) => x.n)).toEqual([0, 0, 0, 3]);
  });

  it("dá os dados do mapa: todos os estados e, com UF filtrada, os municípios", async () => {
    const brasil = await calcularAnalises(db, CANDIDATOS, {}, 1, dados);
    expect(Object.fromEntries(brasil.porUf.map((u) => [u.codigo, u.n]))).toEqual({ SP: 5, RJ: 3 });
    expect(brasil.municipiosDaUf).toEqual([]);

    const sp = await calcularAnalises(db, CANDIDATOS, { uf: "SP" }, 1, dados);
    expect(sp.porUf.map((u) => u.codigo).sort()).toEqual(["RJ", "SP"]); // o mapa do Brasil não esconde os outros estados
    expect(Object.fromEntries(sp.municipiosDaUf.map((m) => [m.nome, m.n]))).toEqual({ "São Paulo": 4, Campinas: 1 });
  });

  it("com limite maior que 1, mostra a contagem mas oculta a afinidade de grupos pequenos", async () => {
    const a = await calcularAnalises(db, CANDIDATOS, { uf: "SP" }, 2, dados);
    const campinas = a.municipiosDaUf.find((m) => m.nome === "Campinas")!;
    expect(campinas).toMatchObject({ n: 1, pontosA: null });
    expect(a.municipiosDaUf.find((m) => m.nome === "São Paulo")!.pontosA).not.toBeNull();
  });
});
