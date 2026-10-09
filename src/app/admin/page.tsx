import { candidates } from "@/lib/data";
import { formatPercent } from "@/lib/affinity";
import { FAIXA_IDS, UF_SIGLAS, type FaixaEtaria, type Genero } from "@/lib/perfil";
import { Filtros } from "@/components/admin/Filtros";
import { BarraDividida, Grupos } from "@/components/admin/Grupos";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { exigirAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import { env } from "@/server/env";
import { municipioPertenceAUf, municipiosPorUf } from "@/server/municipios";
import { calcularEstatisticas, type Filtros as FiltrosEstatisticas } from "@/server/services/estatisticas";

type Busca = Record<string, string | string[] | undefined>;

/** Aceita só valores conhecidos; qualquer outro parâmetro é ignorado. */
function lerFiltros(busca: Busca): FiltrosEstatisticas {
  const texto = (k: string) => (typeof busca[k] === "string" ? (busca[k] as string) : undefined);
  const uf = texto("uf");
  const filtros: FiltrosEstatisticas = {};
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

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await exigirAdmin();
  const filtros = lerFiltros(await searchParams);
  const ids = candidates.map((c) => c.id) as [string, string];
  const limite = env().PRIVACY_MIN_GROUP;
  const est = await calcularEstatisticas(db(), ids, filtros, limite);
  const [a, b] = candidates;

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="mt-1 text-sm text-muted">Estatísticas agregadas das participações. Nenhuma resposta individual é exibida.</p>
        </div>
        <LogoutButton />
      </header>

      <p role="note" className="rounded-xl bg-surface-2 px-4 py-3 text-xs leading-relaxed text-muted">
        <strong className="text-ink">Uso interno.</strong> Estes números vêm de participação espontânea, sem plano amostral
        nem método científico: não são pesquisa eleitoral. Não divulgue resultados que permitam inferir a ordem dos
        candidatos — isso pode configurar enquete proibida no período eleitoral (Res. TSE 23.600/2019, art. 23).
      </p>

      <Filtros valores={filtros} municipiosDaUf={filtros.uf ? municipiosPorUf[filtros.uf] : []} />

      {est.total === null ? (
        <p className="border-y border-line py-10 text-center text-sm text-muted">
          Este recorte tem menos de {limite} participações. Para proteger a privacidade, os dados não são exibidos.
        </p>
      ) : (
        <>
          <section className="grid gap-8 border-y border-line py-8 sm:grid-cols-[auto_1fr] sm:items-center">
            <div>
              <p className="text-xs text-muted">Participações</p>
              <p className="text-5xl font-semibold tracking-tight tabular-nums">{est.total.toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>
                  {a.name} <strong className="ml-1 tabular-nums">{formatPercent(est.geral![a.id])}%</strong>
                </span>
                <span>
                  <strong className="mr-1 tabular-nums">{formatPercent(est.geral![b.id])}%</strong> {b.name}
                </span>
              </div>
              <div className="mt-3 flex">
                <BarraDividida esquerda={est.geral![a.id]} altura="h-3" />
              </div>
              <p className="mt-3 text-xs text-muted">
                Afinidade média (pontos divididos entre os dois candidatos). Nas listas abaixo, a parte escura da barra
                corresponde a {a.name} e a clara, a {b.name}.
              </p>
            </div>
          </section>

          <div className="grid gap-10 md:grid-cols-2">
            <Grupos titulo="Por estado" dados={est.porUf} candidatos={ids} limiteMinimo={limite} />
            <Grupos titulo="Por cidade" nota="As 20 cidades com mais participações no recorte." dados={est.porMunicipio} candidatos={ids} limiteMinimo={limite} />
            <Grupos titulo="Por gênero" dados={est.porGenero} candidatos={ids} limiteMinimo={limite} />
            <Grupos titulo="Por faixa etária" dados={est.porFaixa} candidatos={ids} limiteMinimo={limite} />
          </div>
        </>
      )}
    </div>
  );
}
