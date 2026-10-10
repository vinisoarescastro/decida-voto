import "server-only";
import Link from "next/link";
import brasil from "@/data/mapas/brasil.json";
import { UFS } from "@/lib/perfil";
import type { Candidate } from "@/lib/schema";
import type { Filtros } from "@/server/services/estatisticas";
import type { Regiao } from "@/server/services/analises";
import { municipiosPorUf } from "@/server/municipios";
import { AreaDicas } from "./dicas";
import { LegendaAfinidade, LegendaContagem } from "./legendas";
import { COR_DIVISA, corAfinidade, corContagem, linhasAfinidade, plural } from "./escalas";
import { urlPainel, type Metrica } from "./ler-filtros";

type MapaSvg = { viewBox: string; caminhos: Record<string, string> };

// Contornos gerados por scripts/gerar-mapas.mjs (malhas do IBGE). Os de municípios são carregados só
// para a UF filtrada, no servidor: nada disso vai para o site público.
async function municipiosSvg(uf: string): Promise<MapaSvg> {
  return (await import(`@/data/mapas/municipios/${uf}.json`)).default as MapaSvg;
}

const nomeUf = (sigla: string) => UFS.find((u) => u.sigla === sigla)?.nome ?? sigla;

export async function MapaPainel({
  filtros,
  metrica,
  porUf,
  municipiosDaUf,
  candidatos,
}: {
  filtros: Filtros;
  metrica: Metrica;
  porUf: Regiao[];
  municipiosDaUf: Regiao[];
  candidatos: Candidate[];
}) {
  const nomes = [candidatos[0].name, candidatos[1].name] as [string, string];
  const uf = filtros.uf;
  const mapa: MapaSvg = uf ? await municipiosSvg(uf) : (brasil as MapaSvg);
  const dados = new Map((uf ? municipiosDaUf : porUf).map((r) => [r.codigo, r]));
  const maximo = Math.max(0, ...[...dados.values()].map((r) => r.n));
  const selecionado = uf ? (filtros.municipio ? String(filtros.municipio) : null) : null;

  const nomeDe = (codigo: string) =>
    uf ? (municipiosPorUf[uf]?.find(([c]) => String(c) === codigo)?.[1] ?? codigo) : nomeUf(codigo);
  const destino = (codigo: string) =>
    uf
      ? urlPainel({ ...filtros, municipio: selecionado === codigo ? undefined : Number(codigo), metrica })
      : urlPainel({ genero: filtros.genero, faixa: filtros.faixa, uf: codigo, metrica });

  // O selecionado é desenhado por último, para o contorno de destaque ficar por cima dos vizinhos.
  const regioes = Object.entries(mapa.caminhos).sort(([a], [b]) => Number(a === selecionado) - Number(b === selecionado));
  const comParticipacao = [...dados.values()].filter((r) => r.n > 0).length;

  return (
    <section aria-labelledby="mapa-titulo" className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="mapa-titulo" className="font-semibold">
            {uf ? `${nomeUf(uf)} por município` : "Mapa do Brasil"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {uf ? (
              <>
                <Link href={urlPainel({ genero: filtros.genero, faixa: filtros.faixa, metrica })} className="underline underline-offset-2 hover:text-ink">
                  Brasil
                </Link>{" "}
                › {nomeUf(uf)} · {plural(comParticipacao, "município com participação", "municípios com participação")}. Clique
                num município para filtrar.
              </>
            ) : (
              <>
                {plural(comParticipacao, "estado com participação", "estados com participação")}. Clique num estado para ver os
                municípios.
              </>
            )}
          </p>
        </div>
        <nav aria-label="Métrica do mapa" className="inline-flex rounded-full border border-line bg-surface-2 p-1 text-sm">
          {(["afinidade", "participacoes"] as const).map((m) => (
            <Link
              key={m}
              href={urlPainel({ ...filtros, metrica: m })}
              aria-current={m === metrica ? "page" : undefined}
              className="inline-flex h-9 items-center rounded-full px-3.5 font-medium text-muted transition-colors hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-sm"
            >
              {m === "afinidade" ? "Afinidade" : "Participações"}
            </Link>
          ))}
        </nav>
      </div>

      <AreaDicas className="mt-4">
        <svg viewBox={mapa.viewBox} role="group" aria-label={uf ? `Municípios de ${nomeUf(uf)}` : "Estados do Brasil"} className="mx-auto block max-h-[34rem] w-full">
          {regioes.map(([codigo, d]) => {
            const r = dados.get(codigo);
            const n = r?.n ?? 0;
            const nome = nomeDe(codigo);
            const cor = metrica === "participacoes" ? corContagem(n, maximo) : corAfinidade(n > 0 ? (r?.pontosA ?? null) : null);
            const texto =
              n === 0 ? `${nome}\nNenhuma participação` : `${nome}\n${linhasAfinidade(r?.pontosA ?? null, nomes)}\n${plural(n, "participação", "participações")}`;
            const ativo = codigo === selecionado;
            return (
              <a key={codigo} href={destino(codigo)} aria-label={texto.replaceAll("\n", ", ")} data-dica={texto} className="outline-none [&:focus-visible>path]:[stroke:var(--ink)]">
                {/* Divisas em cinza visível (o branco sumia sobre os tons claros); contorno escuro ao passar o mouse. */}
                <path
                  d={d}
                  style={{ fill: cor, stroke: ativo ? "var(--ink)" : COR_DIVISA, strokeWidth: ativo ? 3 : uf ? 0.75 : 1.25 }}
                  className="transition-[opacity] hover:opacity-85 hover:[stroke:var(--ink)] hover:[stroke-width:2.5px]"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </a>
            );
          })}
        </svg>
      </AreaDicas>

      <div className="mt-4">
        {metrica === "afinidade" ? <LegendaAfinidade nomes={nomes} /> : <LegendaContagem maximo={maximo} />}
      </div>
      <p className="mt-3 text-[11px] text-muted">Contornos: malhas territoriais do IBGE. A tabela de cada grupo está em “Por estado” e “Por cidade”.</p>
    </section>
  );
}
