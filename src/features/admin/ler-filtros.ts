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
