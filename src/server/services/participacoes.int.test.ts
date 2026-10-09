import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { computeAffinity } from "@/lib/affinity";
import { participacoes, respostas, resultados } from "../db/schema";
import { criarDbDeTeste, limpar } from "../test/db";
import { base, entrada, respostasComValor } from "../test/fixtures";
import { DadosInvalidos, registrarParticipacao } from "./participacoes";

const { db, fechar } = criarDbDeTeste();
beforeEach(() => limpar(db));
afterAll(() => fechar());

describe("registrarParticipacao", () => {
  it("grava perfil (com faixa etária), resultados recalculados no servidor e respostas", async () => {
    await registrarParticipacao(db, entrada({ idade: 30 }, 2), base);

    const [p] = await db.select().from(participacoes);
    expect(p).toMatchObject({ uf: "SP", municipioCodigo: 3550308, genero: "mulher", faixaEtaria: "25-34" });
    // Somente a data, sem horário; nenhuma coluna de idade exata, IP ou identificador externo.
    expect(p.dataEnvio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(p).sort()).toEqual(
      ["dataEnvio", "faixaEtaria", "genero", "id", "municipioCodigo", "temasComparaveis", "uf", "versaoPerguntas", "versaoPosicoes"].sort(),
    );

    const rs = await db.select().from(resultados);
    const esperado = computeAffinity(base.questions, base.candidates, base.positions, respostasComValor(2));
    for (const s of esperado.scores) {
      const r = rs.find((x) => x.candidatoId === s.candidateId)!;
      expect(Number(r.pontos)).toBeCloseTo(s.share, 3);
      expect(Number(r.concordancia)).toBeCloseTo(s.agreement, 3);
    }
    expect(rs.reduce((acc, r) => acc + Number(r.pontos), 0)).toBeCloseTo(100, 3);

    const resp = await db.select().from(respostas);
    expect(resp).toHaveLength(base.questions.length);
    expect(resp.every((r) => r.valor === 2)).toBe(true);
  });

  it("recusa município que não pertence à UF, sem gravar nada", async () => {
    await expect(registrarParticipacao(db, entrada({ uf: "RJ", municipio: 3550308 }), base)).rejects.toBeInstanceOf(DadosInvalidos);
    expect(await db.select().from(participacoes)).toHaveLength(0);
  });

  it("recusa respostas incompletas, com pergunta desconhecida ou alternativa inválida", async () => {
    const e = entrada();
    const [primeira, ...demais] = Object.keys(e.respostas);
    const incompleta = { ...e, respostas: Object.fromEntries(demais.map((k) => [k, "a"])) };
    await expect(registrarParticipacao(db, incompleta, base)).rejects.toBeInstanceOf(DadosInvalidos);
    await expect(registrarParticipacao(db, { ...e, respostas: { ...e.respostas, extra: "a" } }, base)).rejects.toBeInstanceOf(DadosInvalidos);
    await expect(registrarParticipacao(db, { ...e, respostas: { ...e.respostas, [primeira]: "z" } }, base)).rejects.toBeInstanceOf(DadosInvalidos);
    expect(await db.select().from(participacoes)).toHaveLength(0);
  });
});

describe("restrições do banco", () => {
  it("impede município de outra UF, valores fora da escala e pontos fora de 0–100", async () => {
    await expect(
      db.execute(sql`insert into participacoes (uf, municipio_codigo, genero, faixa_etaria, temas_comparaveis, versao_perguntas, versao_posicoes)
                     values ('RJ', 3550308, 'homem', '25-34', 9, 'x', 'y')`),
    ).rejects.toThrow();

    await registrarParticipacao(db, entrada(), base);
    const [{ id }] = await db.select({ id: participacoes.id }).from(participacoes);
    await expect(db.execute(sql`update respostas set valor = 5 where participacao_id = ${id}`)).rejects.toThrow();
    await expect(db.execute(sql`update resultados set pontos = 101 where participacao_id = ${id}`)).rejects.toThrow();
    await expect(db.execute(sql`update participacoes set faixa_etaria = '10-15' where id = ${id}`)).rejects.toThrow();
  });

  it("apaga resultados e respostas junto com a participação", async () => {
    await registrarParticipacao(db, entrada(), base);
    await db.delete(participacoes);
    expect(await db.select().from(resultados)).toHaveLength(0);
    expect(await db.select().from(respostas)).toHaveLength(0);
  });
});
