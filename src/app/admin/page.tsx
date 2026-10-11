import { candidates, positions, questions } from "@/lib/data";
import { formatPercent } from "@/lib/affinity";
import { IconeInfo } from "@/components/ui/icon";
import { MarcadorCandidato, Sobretitulo } from "@/components/ui/text";
import { AbasPainel } from "@/features/admin/abas";
import { Filtros } from "@/features/admin/filters";
import { BarraDividida, Grupos } from "@/features/admin/groups";
import {
  GraficoAfinidadeDia,
  GraficoContagem,
  GraficoCruzamento,
  GraficoDistribuicao,
  GraficoIntensidade,
  GraficoMaisProximos,
  GraficoOrigens,
  GraficoParticipacoesDia,
  GraficoRespostas,
  GraficoTemas,
  Indicadores,
} from "@/features/admin/graficos";
import { lerFiltros, lerMetrica } from "@/features/admin/ler-filtros";
import { MapaPainel } from "@/features/admin/mapa";
import { BotaoSair } from "@/features/admin/logout-button";
import { FormularioResponsavel } from "@/features/admin/responsavel-form";
import { exigirAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import { env } from "@/server/env";
import { municipiosPorUf } from "@/server/municipios";
import { calcularAnalises } from "@/server/services/analises";
import { calcularEstatisticas } from "@/server/services/estatisticas";
import { lerResponsavel } from "@/server/services/responsavel";

export default async function PaginaPainel({ searchParams }: PageProps<"/admin">) {
  await exigirAdmin();
  const busca = await searchParams;
  const filtros = lerFiltros(busca);
  const metrica = lerMetrica(busca);
  const ids = candidates.map((c) => c.id) as [string, string];
  const limite = env().PRIVACY_MIN_GROUP;
  const [est, analises, responsavel] = await Promise.all([
    calcularEstatisticas(db(), ids, filtros, limite),
    calcularAnalises(db(), ids, filtros, limite, { questions, positions }),
    lerResponsavel(db()),
  ]);
  const [a, b] = candidates;
  const comFiltro = Object.values(filtros).some((v) => v !== undefined);

  return (
    <div className="animate-surgir space-y-6 sm:space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Sobretitulo>Área administrativa</Sobretitulo>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-3xl">Painel</h1>
          <p className="mt-1 text-sm text-muted">Estatísticas por grupo, sem nome, contato ou idade exata de quem respondeu.</p>
        </div>
        <BotaoSair />
      </header>

      <AbasPainel atual="estatisticas" />

      <p role="note" className="flex items-start gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-xs leading-relaxed text-muted">
        <IconeInfo className="mt-0.5 shrink-0 text-ink" />
        <span>
          <strong className="text-ink">Uso interno.</strong> Estes números vêm de participação espontânea, sem plano
          amostral nem método científico: não são pesquisa eleitoral. Não divulgue resultados que permitam inferir a ordem
          dos candidatos — isso pode configurar enquete proibida no período eleitoral (Res. TSE 23.600/2019, art. 23).
        </span>
      </p>

      <Filtros valores={filtros} municipiosDaUf={filtros.uf ? municipiosPorUf[filtros.uf] : []} />

      {est.geral === null ? (
        <p className="rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center text-sm text-muted">
          {est.total === 0
            ? "Nenhuma participação neste recorte ainda."
            : `Este recorte tem ${est.total.toLocaleString("pt-BR")} ${est.total === 1 ? "participação" : "participações"}, menos que o mínimo de ${limite} configurado para exibir a afinidade.`}
          {comFiltro && <span className="mt-1 block">Total geral: {est.totalGeral.toLocaleString("pt-BR")}.</span>}
        </p>
      ) : (
        <>
          <section className="grid gap-5 rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10 sm:p-6">
            <div>
              <p className="text-xs font-medium text-muted">{comFiltro ? "Participações neste recorte" : "Participações"}</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">{est.total.toLocaleString("pt-BR")}</p>
              {comFiltro && (
                <p className="mt-1 text-xs text-muted">de {est.totalGeral.toLocaleString("pt-BR")} no total</p>
              )}
            </div>
            <div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-2">
                  <MarcadorCandidato indice={0} />
                  {a.name} <strong className="tabular-nums">{formatPercent(est.geral![a.id])}%</strong>
                </span>
                <span className="inline-flex items-center gap-2">
                  <strong className="tabular-nums">{formatPercent(est.geral![b.id])}%</strong> {b.name}
                  <MarcadorCandidato indice={1} />
                </span>
              </div>
              <div className="mt-3 flex">
                <BarraDividida esquerda={est.geral![a.id]} altura="h-3" />
              </div>
              <p className="mt-3 text-xs text-muted">Afinidade média (pontos divididos entre os dois candidatos).</p>
            </div>
          </section>

          <Indicadores a={analises} total={est.total} candidatos={candidates} />
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <GraficoMaisProximos a={analises} candidatos={candidates} />
            <GraficoIntensidade a={analises} candidatos={candidates} />
          </div>
        </>
      )}

      <MapaPainel filtros={filtros} metrica={metrica} porUf={analises.porUf} municipiosDaUf={analises.municipiosDaUf} candidatos={candidates} />

      {est.geral !== null && (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <GraficoParticipacoesDia a={analises} />
            <div className="space-y-5">
              <GraficoAfinidadeDia a={analises} candidatos={candidates} />
              <GraficoDistribuicao a={analises} candidatos={candidates} />
            </div>
          </div>
          <GraficoOrigens a={analises} total={est.total} />

          <h2 className="pt-2 text-lg font-semibold tracking-tight">Quem respondeu</h2>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <GraficoContagem titulo="Idade de quem respondeu" dados={est.porFaixa} total={est.total} candidatos={candidates} />
            <GraficoCruzamento a={analises} candidatos={candidates} />
            <GraficoContagem titulo="Estados com mais participações" nota="Os 10 primeiros no recorte." dados={est.porUf} total={est.total} candidatos={candidates} limite={10} />
            <GraficoContagem titulo="Cidades com mais participações" nota="As 10 primeiras no recorte." dados={est.porMunicipio} total={est.total} candidatos={candidates} limite={10} />
          </div>
          <GraficoTemas a={analises} candidatos={candidates} />
          <GraficoRespostas a={analises} candidatos={candidates} />

          <h2 className="pt-2 text-lg font-semibold tracking-tight">Detalhe por grupo</h2>
          <div className="grid items-start gap-5 md:grid-cols-2">
            <Grupos titulo="Por estado" dados={est.porUf} candidatos={ids} limiteMinimo={limite} />
            <Grupos titulo="Por cidade" nota="As 20 cidades com mais participações no recorte." dados={est.porMunicipio} candidatos={ids} limiteMinimo={limite} />
            <Grupos titulo="Por gênero" dados={est.porGenero} candidatos={ids} limiteMinimo={limite} />
            <Grupos titulo="Por faixa etária" dados={est.porFaixa} candidatos={ids} limiteMinimo={limite} />
          </div>
        </>
      )}

      <FormularioResponsavel inicial={responsavel} />
    </div>
  );
}
