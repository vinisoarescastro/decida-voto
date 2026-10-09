import { and, count, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { FAIXAS_ETARIAS, GENEROS, UFS, type FaixaEtaria, type Genero } from "@/lib/perfil";
import { participacoes, resultados } from "../db/schema";
import type { AnyDb } from "../db/types";
import { nomesMunicipios } from "../municipios";

// Estatísticas exclusivamente agregadas para o painel administrativo.
// Regra de privacidade: qualquer grupo com menos de `limiteMinimo` participações é ocultado
// (nem o número exato é exibido), para reduzir o risco de identificação indireta.

export type Filtros = { uf?: string; municipio?: number; genero?: Genero; faixa?: FaixaEtaria };
export type Dimensao = "uf" | "municipio" | "genero" | "faixa";

export type Grupo = {
  chave: string;
  rotulo: string;
  participacoes: number;
  /** Fração do total filtrado (0..1). */
  proporcao: number;
  /** Média de pontos por candidato (0..100); somam 100. */
  pontos: Record<string, number>;
};

export type Agrupamento = { grupos: Grupo[]; ocultos: number };

export type Estatisticas = {
  limiteMinimo: number;
  /** null quando o total filtrado é menor que o limite (tudo fica oculto). */
  total: number | null;
  geral: Record<string, number> | null;
  porUf: Agrupamento;
  porMunicipio: Agrupamento;
  porGenero: Agrupamento;
  porFaixa: Agrupamento;
};

const COLUNAS = {
  uf: participacoes.uf,
  municipio: participacoes.municipioCodigo,
  genero: participacoes.genero,
  faixa: participacoes.faixaEtaria,
} as const;

function rotular(dimensao: Dimensao, chave: string): string {
  switch (dimensao) {
    case "uf":
      return UFS.find((u) => u.sigla === chave)?.nome ?? chave;
    case "municipio":
      return nomesMunicipios.get(Number(chave)) ?? chave;
    case "genero":
      return GENEROS.find((g) => g.id === chave)?.label ?? chave;
    case "faixa":
      return FAIXAS_ETARIAS.find((f) => f.id === chave)?.label ?? chave;
  }
}

function condicoes(f: Filtros): SQL | undefined {
  return and(
    f.uf ? eq(participacoes.uf, f.uf) : undefined,
    f.municipio ? eq(participacoes.municipioCodigo, f.municipio) : undefined,
    f.genero ? eq(participacoes.genero, f.genero) : undefined,
    f.faixa ? eq(participacoes.faixaEtaria, f.faixa) : undefined,
  );
}

type Linha = { grupo: string | null; n: number; pa: number; pb: number };

async function consultar(db: AnyDb, candidatos: [string, string], filtros: Filtros, dimensao?: Dimensao): Promise<Linha[]> {
  const ra = alias(resultados, "ra");
  const rb = alias(resultados, "rb");
  const coluna = dimensao ? COLUNAS[dimensao] : undefined;
  const base = db
    .select({
      grupo: coluna ? sql<string>`${coluna}::text` : sql<null>`null`,
      n: count(),
      pa: sql<number>`avg(${ra.pontos})::float8`,
      pb: sql<number>`avg(${rb.pontos})::float8`,
    })
    .from(participacoes)
    .innerJoin(ra, and(eq(ra.participacaoId, participacoes.id), eq(ra.candidatoId, candidatos[0])))
    .innerJoin(rb, and(eq(rb.participacaoId, participacoes.id), eq(rb.candidatoId, candidatos[1])))
    .where(condicoes(filtros));
  return coluna ? base.groupBy(coluna) : base;
}

function montarAgrupamento(
  linhas: Linha[],
  dimensao: Dimensao,
  candidatos: [string, string],
  total: number,
  limite: number,
  ordenar: (a: Grupo, b: Grupo) => number,
  maximo?: number,
): Agrupamento {
  const visiveis = linhas.filter((l) => l.n >= limite);
  const grupos = visiveis
    .map<Grupo>((l) => ({
      chave: l.grupo!,
      rotulo: rotular(dimensao, l.grupo!),
      participacoes: l.n,
      proporcao: l.n / total,
      pontos: { [candidatos[0]]: l.pa, [candidatos[1]]: l.pb },
    }))
    .sort(ordenar);
  const limitados = maximo ? grupos.slice(0, maximo) : grupos;
  return { grupos: limitados, ocultos: linhas.length - visiveis.length };
}

const vazio: Agrupamento = { grupos: [], ocultos: 0 };
const porTamanho = (a: Grupo, b: Grupo) => b.participacoes - a.participacoes || a.rotulo.localeCompare(b.rotulo, "pt-BR");
const naOrdem = (ids: readonly string[]) => (a: Grupo, b: Grupo) => ids.indexOf(a.chave) - ids.indexOf(b.chave);

export async function calcularEstatisticas(
  db: AnyDb,
  candidatos: [string, string],
  filtros: Filtros,
  limiteMinimo: number,
): Promise<Estatisticas> {
  const [geral] = await consultar(db, candidatos, filtros);
  const total = geral?.n ?? 0;
  if (total < limiteMinimo) {
    return { limiteMinimo, total: null, geral: null, porUf: vazio, porMunicipio: vazio, porGenero: vazio, porFaixa: vazio };
  }

  const [uf, municipio, genero, faixa] = await Promise.all(
    (["uf", "municipio", "genero", "faixa"] as const).map((d) => consultar(db, candidatos, filtros, d)),
  );

  return {
    limiteMinimo,
    total,
    geral: { [candidatos[0]]: geral.pa, [candidatos[1]]: geral.pb },
    porUf: montarAgrupamento(uf, "uf", candidatos, total, limiteMinimo, porTamanho),
    porMunicipio: montarAgrupamento(municipio, "municipio", candidatos, total, limiteMinimo, porTamanho, 20),
    porGenero: montarAgrupamento(genero, "genero", candidatos, total, limiteMinimo, naOrdem(GENEROS.map((g) => g.id))),
    porFaixa: montarAgrupamento(faixa, "faixa", candidatos, total, limiteMinimo, naOrdem(FAIXAS_ETARIAS.map((f) => f.id))),
  };
}
