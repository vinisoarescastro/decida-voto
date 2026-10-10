import { and, eq, sql } from "drizzle-orm";
import { alias, type PgSelect } from "drizzle-orm/pg-core";
import { SIMILARITY_THRESHOLD, themeAffinity } from "@/lib/affinity";
import type { Position, Question } from "@/lib/schema";
import { participacoes, respostas, resultados } from "../db/schema";
import type { AnyDb } from "../db/types";
import { nomesMunicipios } from "../municipios";
import { condicoes, type Filtros } from "./estatisticas";

/** "Hoje" no horário de Brasília, o mesmo critério usado ao gravar data_envio. */
const HOJE_BRASILIA = sql`(now() at time zone 'America/Sao_Paulo')::date`;

// Análises do painel (gráficos e mapa), sempre sobre o recorte dos filtros.
// Contagens aparecem sempre; a afinidade de um grupo só aparece com pelo menos `limite` participações
// (PRIVACY_MIN_GROUP, hoje 1). "pontosA" é a média de pontos do 1º candidato (0..100); o 2º é 100 − pontosA.

export type Celula = { n: number; pontosA: number | null };
export type Dia = Celula & { dia: string };
export type Regiao = Celula & { codigo: string; nome: string };
export type CruzamentoCelula = Celula & { genero: string; faixa: string };
export type Tema = { perguntaId: string; tema: string; n: number; concordancia: Record<string, number | null> };

export type Analises = {
  hoje: number;
  ultimos7: number;
  /** Participações com diferença entre os candidatos menor que o limiar de "equilibrado" do resultado. */
  equilibrados: number;
  /** Concordância absoluta média (0..100) com cada candidato. */
  concordancia: Record<string, number | null>;
  porDia: Dia[];
  /** Participações por faixa de pontos do 1º candidato: [0–10), [10–20) … [90–100]. */
  distribuicao: number[];
  cruzamento: CruzamentoCelula[];
  porTema: Tema[];
  porUf: Regiao[];
  /** Municípios da UF filtrada (vazio sem filtro de UF). */
  municipiosDaUf: Regiao[];
};

const num = (v: unknown) => Number(v ?? 0);
const media = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function calcularAnalises(
  db: AnyDb,
  candidatos: [string, string],
  filtros: Filtros,
  limite: number,
  base: { questions: Question[]; positions: Position[] },
): Promise<Analises> {
  const ra = alias(resultados, "ra");
  const rb = alias(resultados, "rb");
  // Participações do recorte com os pontos dos dois candidatos (padrão de consulta dinâmica do Drizzle).
  const juncao = <T extends PgSelect>(q: T) =>
    q
      .innerJoin(ra, and(eq(ra.participacaoId, participacoes.id), eq(ra.candidatoId, candidatos[0])))
      .innerJoin(rb, and(eq(rb.participacaoId, participacoes.id), eq(rb.candidatoId, candidatos[1])))
      .where(condicoes(filtros));
  const celula = (n: unknown, pa: unknown): Celula => ({ n: num(n), pontosA: num(n) >= limite ? media(pa) : null });

  const [resumo, dias, faixas, cruz, ufs, temas, muns] = await Promise.all([
    juncao(db.select({
      hoje: sql<number>`count(*) filter (where ${participacoes.dataEnvio} = ${HOJE_BRASILIA})::int`,
      semana: sql<number>`count(*) filter (where ${participacoes.dataEnvio} >= ${HOJE_BRASILIA} - 6)::int`,
      equilibrados: sql<number>`count(*) filter (where abs(${ra.pontos} - ${rb.pontos}) < ${SIMILARITY_THRESHOLD})::int`,
      ca: sql<number>`avg(${ra.concordancia})::float8`,
      cb: sql<number>`avg(${rb.concordancia})::float8`,
    }).from(participacoes).$dynamic()),
    juncao(db.select({ dia: sql<string>`${participacoes.dataEnvio}::text`, n: sql<number>`count(*)::int`, pa: sql<number>`avg(${ra.pontos})::float8` }).from(participacoes).$dynamic())
      .groupBy(participacoes.dataEnvio)
      .orderBy(participacoes.dataEnvio),
    juncao(db.select({ faixa: sql<number>`least(floor(${ra.pontos} / 10), 9)::int`, n: sql<number>`count(*)::int` }).from(participacoes).$dynamic()).groupBy(sql`1`),
    juncao(db.select({
      genero: sql<string>`${participacoes.genero}::text`,
      faixa: sql<string>`${participacoes.faixaEtaria}::text`,
      n: sql<number>`count(*)::int`,
      pa: sql<number>`avg(${ra.pontos})::float8`,
    }).from(participacoes).$dynamic()).groupBy(participacoes.genero, participacoes.faixaEtaria),
    // O mapa do Brasil mostra todos os estados, mesmo com filtro de UF (o estado filtrado ganha destaque).
    db
      .select({ uf: participacoes.uf, n: sql<number>`count(*)::int`, pa: sql<number>`avg(${ra.pontos})::float8` })
      .from(participacoes)
      .innerJoin(ra, and(eq(ra.participacaoId, participacoes.id), eq(ra.candidatoId, candidatos[0])))
      .where(condicoes({ genero: filtros.genero, faixa: filtros.faixa }))
      .groupBy(participacoes.uf),
    db
      .select({ pergunta: respostas.perguntaId, valor: respostas.valor, n: sql<number>`count(*)::int` })
      .from(respostas)
      .innerJoin(participacoes, eq(participacoes.id, respostas.participacaoId))
      .where(condicoes(filtros))
      .groupBy(respostas.perguntaId, respostas.valor),
    filtros.uf
      ? db
          .select({ codigo: participacoes.municipioCodigo, n: sql<number>`count(*)::int`, pa: sql<number>`avg(${ra.pontos})::float8` })
          .from(participacoes)
          .innerJoin(ra, and(eq(ra.participacaoId, participacoes.id), eq(ra.candidatoId, candidatos[0])))
          .where(condicoes({ uf: filtros.uf, genero: filtros.genero, faixa: filtros.faixa }))
          .groupBy(participacoes.municipioCodigo)
      : Promise.resolve([]),
  ]);

  const distribuicao = Array.from({ length: 10 }, (_, i) => num(faixas.find((f) => num(f.faixa) === i)?.n));

  // Concordância por tema, com as posições atuais: média de (1 − distância ÷ 3) ponderada pelas respostas.
  const porTema: Tema[] = base.questions.map((q) => {
    const linhas = temas.filter((t) => t.pergunta === q.id);
    const n = linhas.reduce((s, l) => s + num(l.n), 0);
    const concordancia: Record<string, number | null> = {};
    for (const cid of candidatos) {
      const p = base.positions.find((x) => x.questionId === q.id && x.candidateId === cid);
      concordancia[cid] =
        n === 0 || !p || p.status !== "documented"
          ? null
          : (linhas.reduce((s, l) => s + num(l.n) * themeAffinity(num(l.valor), p.value), 0) / n) * 100;
    }
    return { perguntaId: q.id, tema: q.theme, n, concordancia };
  });

  const [r] = resumo;
  return {
    hoje: num(r?.hoje),
    ultimos7: num(r?.semana),
    equilibrados: num(r?.equilibrados),
    concordancia: { [candidatos[0]]: media(r?.ca), [candidatos[1]]: media(r?.cb) },
    porDia: dias.map((d) => ({ dia: d.dia, ...celula(d.n, d.pa) })),
    distribuicao,
    cruzamento: cruz.map((c) => ({ genero: c.genero, faixa: c.faixa, ...celula(c.n, c.pa) })),
    porTema,
    porUf: ufs.map((u) => ({ codigo: u.uf, nome: u.uf, ...celula(u.n, u.pa) })),
    municipiosDaUf: muns.map((m) => ({ codigo: String(m.codigo), nome: nomesMunicipios.get(m.codigo) ?? String(m.codigo), ...celula(m.n, m.pa) })),
  };
}
