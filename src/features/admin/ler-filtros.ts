import { FAIXA_IDS, UF_SIGLAS, type FaixaEtaria, type Genero } from "@/lib/perfil";
import { municipioPertenceAUf } from "@/server/municipios";
import type { Filtros } from "@/server/services/estatisticas";

type Busca = Record<string, string | string[] | undefined>;

/** Lê os filtros da URL do painel aceitando só valores conhecidos; qualquer outro parâmetro é ignorado. */
export function lerFiltros(busca: Busca): Filtros {
  const texto = (k: string) => (typeof busca[k] === "string" ? (busca[k] as string) : undefined);
  const filtros: Filtros = {};
  const uf = texto("uf");
  if (uf && UF_SIGLAS.includes(uf)) {
    filtros.uf = uf;
    const municipio = Number(texto("municipio"));
    if (Number.isInteger(municipio) && municipioPertenceAUf(uf, municipio)) filtros.municipio = municipio;
  }
  const genero = texto("genero");
  if (genero === "homem" || genero === "mulher") filtros.genero = genero as Genero;
  const faixa = texto("faixa");
  if (faixa && (FAIXA_IDS as string[]).includes(faixa)) filtros.faixa = faixa as FaixaEtaria;
  return filtros;
}

export type Metrica = "afinidade" | "participacoes";

/** Métrica do mapa (afinidade ou participações), lida da URL. */
export function lerMetrica(busca: Busca): Metrica {
  return busca.metrica === "participacoes" ? "participacoes" : "afinidade";
}

/** Endereço do painel com os filtros e a métrica informados (valores ausentes saem da URL). */
export function urlPainel(f: Filtros & { metrica?: Metrica }): string {
  const p = new URLSearchParams();
  if (f.uf) p.set("uf", f.uf);
  if (f.uf && f.municipio) p.set("municipio", String(f.municipio));
  if (f.genero) p.set("genero", f.genero);
  if (f.faixa) p.set("faixa", f.faixa);
  if (f.metrica === "participacoes") p.set("metrica", "participacoes");
  const q = p.toString();
  return q ? `/admin/?${q}` : "/admin/";
}
