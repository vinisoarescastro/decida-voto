import type { ReactNode } from "react";
import { formatPercent } from "@/lib/affinity";
import { FAIXAS_ETARIAS, GENEROS } from "@/lib/perfil";
import type { Candidate } from "@/lib/schema";
import { MarcadorCandidato } from "@/components/ui/text";
import type { Analises } from "@/server/services/analises";
import { AreaDicas } from "./dicas";
import { corAfinidade, plural, textoAfinidade } from "./escalas";
import { LegendaAfinidade } from "./legendas";

// Gráficos do painel, gerados no servidor (HTML/CSS). Regras seguidas: barras finas (≤ 24 px) com ponta
// arredondada e base reta, 2 px de espaço entre partes, um eixo por gráfico, legenda sempre que há duas
// séries, texto na cor do texto (nunca na cor da série) e uma tabela com os mesmos valores em cada gráfico.

type Nomes = [string, string];
const nomesDe = (c: Candidate[]): Nomes => [c[0].name, c[1].name];
const dataCurta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const pct = (v: number | null) => (v === null ? "—" : `${formatPercent(v)}%`);

function Cartao({ titulo, nota, children, className = "" }: { titulo: string; nota?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6 ${className}`}>
      <h2 className="font-semibold">{titulo}</h2>
      {nota && <p className="mt-0.5 text-xs leading-relaxed text-muted">{nota}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Tabela equivalente ao gráfico (acessível e sem depender de cor ou de passar o mouse). */
function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: (string | number)[][] }) {
  if (linhas.length === 0) return null;
  return (
    <details className="group mt-4 text-xs">
      <summary className="inline-flex min-h-9 cursor-pointer items-center font-medium text-muted underline decoration-muted/40 underline-offset-4 hover:text-ink">
        Ver dados em tabela
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              {cabecalho.map((c) => (
                <th key={c} scope="col" className="py-1.5 pr-4 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                {l.map((v, j) => (
                  <td key={j} className="py-1.5 pr-4">
                    {typeof v === "number" ? v.toLocaleString("pt-BR") : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Legenda2({ candidatos }: { candidatos: Candidate[] }) {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {candidatos.map((c, i) => (
        <span key={c.id} className="inline-flex items-center gap-1.5">
          <MarcadorCandidato indice={i} />
          {c.name}
        </span>
      ))}
    </p>
  );
}

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm">
      <p className="text-xs font-medium text-muted">{rotulo}</p>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{valor}</div>
      {detalhe && <p className="mt-1 text-xs text-muted">{detalhe}</p>}
    </div>
  );
}

export function Indicadores({ a, total, candidatos }: { a: Analises; total: number; candidatos: Candidate[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Indicador rotulo="Hoje" valor={a.hoje.toLocaleString("pt-BR")} detalhe="participações no recorte" />
      <Indicador rotulo="Últimos 7 dias" valor={a.ultimos7.toLocaleString("pt-BR")} detalhe="participações no recorte" />
      <Indicador
        rotulo="Resultados equilibrados"
        valor={total ? `${formatPercent((a.equilibrados / total) * 100)}%` : "—"}
        detalhe={`${plural(a.equilibrados, "pessoa", "pessoas")} com diferença menor que 10 pontos`}
      />
      <div className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm">
        <p className="text-xs font-medium text-muted">Como chegaram</p>
        <ul className="mt-2 space-y-1 text-sm">
          {(
            [
              ["Convite no resultado", a.porOrigem.convite],
              ["Panfleto (QR code)", a.porOrigem.panfleto],
              ["Stories", a.porOrigem.stories],
              ["Direto ou outros", Math.max(0, total - a.porOrigem.convite - a.porOrigem.panfleto - a.porOrigem.stories)],
            ] as const
          ).map(([rotulo, n]) => (
            <li key={rotulo} className="flex items-baseline justify-between gap-2">
              <span className="truncate text-muted">{rotulo}</span>
              <span className="whitespace-nowrap">
                <strong className="font-semibold">{n.toLocaleString("pt-BR")}</strong>
                <span className="ml-1 text-xs text-muted">{total ? `${formatPercent((n / total) * 100)}%` : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-2 rounded-3xl border border-line bg-surface/90 p-5 shadow-sm lg:col-span-1">
        <p className="text-xs font-medium text-muted">Concordância média</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {candidatos.map((c, i) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MarcadorCandidato indice={i} />
                <span className="truncate">{c.name}</span>
              </span>
              <strong className="font-semibold">{pct(a.concordancia[c.id])}</strong>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-muted">100% = mesmas alternativas do candidato</p>
      </div>
    </div>
  );
}

/** Participações por dia (uma série, tom neutro). */
export function GraficoParticipacoesDia({ a, candidatos }: { a: Analises; candidatos: Candidate[] }) {
  const nomes = nomesDe(candidatos);
  const maximo = Math.max(1, ...a.porDia.map((d) => d.n));
  return (
    <Cartao titulo="Participações por dia" nota="Data de envio no horário de Brasília (o horário não é guardado, por privacidade).">
      {a.porDia.length === 0 ? (
        <p className="text-sm text-muted">Sem participações no recorte.</p>
      ) : (
        <AreaDicas>
          <div className="flex items-start justify-between text-[11px] tabular-nums text-muted">
            <span>{maximo.toLocaleString("pt-BR")}</span>
          </div>
          <div className="relative flex h-40 items-end gap-0.5 border-b border-line">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line" />
            {a.porDia.map((d) => (
              <div
                key={d.dia}
                tabIndex={0}
                data-dica={`${dataCurta(d.dia)}\n${plural(d.n, "participação", "participações")}\n${textoAfinidade(d.pontosA, nomes)}`}
                className="group flex h-full max-w-6 flex-1 cursor-default items-end justify-center outline-none"
              >
                <div className="w-full rounded-t-[4px] bg-ink/70 transition-colors group-hover:bg-ink group-focus-visible:bg-ink" style={{ height: `${Math.max(2, (d.n / maximo) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{dataCurta(a.porDia[0].dia)}</span>
            {a.porDia.length > 1 && <span>{dataCurta(a.porDia[a.porDia.length - 1].dia)}</span>}
          </div>
        </AreaDicas>
      )}
      <Tabela cabecalho={["Dia", "Participações"]} linhas={a.porDia.map((d) => [dataCurta(d.dia), d.n])} />
    </Cartao>
  );
}

/** Afinidade média por dia: coluna dividida (100%), com marca dos 50%. */
export function GraficoAfinidadeDia({ a, candidatos }: { a: Analises; candidatos: Candidate[] }) {
  const nomes = nomesDe(candidatos);
  return (
    <Cartao titulo="Afinidade média por dia" nota="Divisão média dos pontos entre os dois candidatos, por dia de envio.">
      <Legenda2 candidatos={candidatos} />
      {a.porDia.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Sem participações no recorte.</p>
      ) : (
        <AreaDicas className="mt-3">
          <div className="relative flex h-40 items-stretch gap-0.5">
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-ink/30" />
            {a.porDia.map((d) => (
              <div
                key={d.dia}
                tabIndex={0}
                data-dica={`${dataCurta(d.dia)}\n${plural(d.n, "participação", "participações")}\n${textoAfinidade(d.pontosA, nomes)}`}
                className="flex max-w-6 flex-1 cursor-default flex-col-reverse gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {d.pontosA === null ? (
                  <div className="flex-1 rounded-[4px] bg-surface-3" />
                ) : (
                  <>
                    <div className="rounded-b-[4px] bg-cand-1" style={{ height: `${d.pontosA}%` }} />
                    <div className="flex-1 rounded-t-[4px] bg-cand-2" />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{dataCurta(a.porDia[0].dia)}</span>
            <span>linha = 50%</span>
            {a.porDia.length > 1 && <span>{dataCurta(a.porDia[a.porDia.length - 1].dia)}</span>}
          </div>
        </AreaDicas>
      )}
      <Tabela
        cabecalho={["Dia", nomes[0], nomes[1]]}
        linhas={a.porDia.map((d) => [dataCurta(d.dia), pct(d.pontosA), pct(d.pontosA === null ? null : 100 - d.pontosA)])}
      />
    </Cartao>
  );
}

/** Distribuição: quantas pessoas ficaram em cada faixa, de "tudo com o 1º" a "tudo com o 2º". */
export function GraficoDistribuicao({ a, candidatos }: { a: Analises; candidatos: Candidate[] }) {
  const nomes = nomesDe(candidatos);
  const faixas = [...a.distribuicao.keys()].reverse(); // da esquerda (mais 1º candidato) para a direita
  const maximo = Math.max(1, ...a.distribuicao);
  const rotulo = (i: number) => `${nomes[0]} ${i * 10}–${i * 10 + 10}% · ${nomes[1]} ${90 - i * 10}–${100 - i * 10}%`;
  return (
    <Cartao titulo="Como as pessoas se distribuem" nota="Cada coluna é uma faixa de afinidade. Colunas nas pontas indicam respostas bem alinhadas a um candidato; no meio, equilibradas.">
      <AreaDicas>
        <div className="flex h-40 items-end gap-0.5 border-b border-line">
          {faixas.map((i) => (
            <div
              key={i}
              tabIndex={0}
              data-dica={`${rotulo(i)}\n${plural(a.distribuicao[i], "pessoa", "pessoas")}`}
              className="group flex h-full flex-1 cursor-default items-end justify-center outline-none"
            >
              <div
                className="w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-ink"
                style={{ height: a.distribuicao[i] ? `${Math.max(2, (a.distribuicao[i] / maximo) * 100)}%` : "0", background: corAfinidade(i * 10 + 5) }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between gap-2 text-[11px] text-muted">
          <span>100% {nomes[0]}</span>
          <span>50%</span>
          <span className="text-right">100% {nomes[1]}</span>
        </div>
      </AreaDicas>
      <Tabela cabecalho={["Faixa de afinidade", "Pessoas"]} linhas={faixas.map((i) => [rotulo(i), a.distribuicao[i]])} />
    </Cartao>
  );
}

/** Concordância por tema: duas barras finas por tema (uma por candidato), 0 a 100%. */
export function GraficoTemas({ a, candidatos }: { a: Analises; candidatos: Candidate[] }) {
  const nomes = nomesDe(candidatos);
  return (
    <Cartao
      titulo="Concordância por tema"
      nota="Quão perto as respostas do recorte ficaram da posição de cada candidato em cada tema (100% = todas na mesma alternativa do candidato). Usa as posições publicadas atualmente."
    >
      <Legenda2 candidatos={candidatos} />
      <AreaDicas className="mt-4">
        <ul className="space-y-4">
          {a.porTema.map((t) => (
            <li key={t.perguntaId} className="grid gap-1.5 sm:grid-cols-[11rem_1fr] sm:items-center sm:gap-4">
              <span className="text-sm">{t.tema}</span>
              <div className="space-y-[2px]">
                {candidatos.map((c, i) => {
                  const v = t.concordancia[c.id];
                  return (
                    <div
                      key={c.id}
                      tabIndex={0}
                      data-dica={`${t.tema} · ${c.name}\n${v === null ? "Sem posição documentada ou sem respostas" : `Concordância de ${formatPercent(v)}%`}\n${plural(t.n, "resposta", "respostas")}`}
                      className="flex cursor-default items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ink"
                    >
                      <div className="h-2.5 flex-1">
                        {v !== null && <div className={`h-full rounded-r-[4px] ${i === 0 ? "bg-cand-1" : "bg-cand-2"}`} style={{ width: `${Math.max(1, v)}%` }} />}
                      </div>
                      <span className="w-10 text-right text-xs tabular-nums text-muted">{pct(v)}</span>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </AreaDicas>
      <Tabela
        cabecalho={["Tema", nomes[0], nomes[1], "Respostas"]}
        linhas={a.porTema.map((t) => [t.tema, pct(t.concordancia[candidatos[0].id]), pct(t.concordancia[candidatos[1].id]), t.n])}
      />
    </Cartao>
  );
}

/** Cruzamento gênero × faixa etária: grade com a afinidade (cor) e o número de participações (texto). */
export function GraficoCruzamento({ a, candidatos }: { a: Analises; candidatos: Candidate[] }) {
  const nomes = nomesDe(candidatos);
  const celula = (g: string, f: string) => a.cruzamento.find((c) => c.genero === g && c.faixa === f);
  return (
    <Cartao titulo="Gênero × faixa etária" nota="Cor = afinidade média; número = participações.">
      <AreaDicas>
        <div className="overflow-x-auto">
          <div className="grid min-w-[22rem] grid-cols-[4.5rem_repeat(6,minmax(0,1fr))] gap-0.5 text-xs">
            <span />
            {FAIXAS_ETARIAS.map((f) => (
              <span key={f.id} className="pb-1 text-center text-[11px] text-muted">
                {f.id}
              </span>
            ))}
            {GENEROS.map((g) => (
              <div key={g.id} className="contents">
                <span className="flex items-center text-muted">{g.label}</span>
                {FAIXAS_ETARIAS.map((f) => {
                  const c = celula(g.id, f.id);
                  const n = c?.n ?? 0;
                  return (
                    <div
                      key={f.id}
                      tabIndex={0}
                      data-dica={`${g.label}, ${f.label}\n${n ? plural(n, "participação", "participações") : "Nenhuma participação"}${n ? `\n${textoAfinidade(c?.pontosA ?? null, nomes)}` : ""}`}
                      className="grid h-12 cursor-default place-items-center rounded-lg font-medium tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
                      style={{ background: corAfinidade(n ? (c?.pontosA ?? null) : null, 52) }}
                    >
                      {n || "—"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </AreaDicas>
      <div className="mt-4">
        <LegendaAfinidade nomes={nomes} intensidadeMaxima={52} />
      </div>
      <Tabela
        cabecalho={["Gênero", "Faixa etária", "Participações", nomes[0], nomes[1]]}
        linhas={a.cruzamento.map((c) => [
          GENEROS.find((g) => g.id === c.genero)?.label ?? c.genero,
          FAIXAS_ETARIAS.find((f) => f.id === c.faixa)?.label ?? c.faixa,
          c.n,
          pct(c.pontosA),
          pct(c.pontosA === null ? null : 100 - c.pontosA),
        ])}
      />
    </Cartao>
  );
}

// Escala ORDINAL de um tom neutro (alternativa 1 → 4), validada com o validador da skill (--ordinal, claro e
// escuro). As cores dos candidatos não entram na barra: o lado de cada um muda de pergunta para pergunta.
const TONS_ESCALA = [34, 52, 70, 88].map((t) => `color-mix(in oklab, var(--ink) ${t}%, var(--surface))`);

/** Respostas por pergunta: quantas pessoas marcaram cada alternativa, com a posição de cada candidato. */
export function GraficoRespostas({ a, candidatos }: { a: Analises; candidatos: Candidate[] }) {
  const ondeEsta = (posicoes: Record<string, number | null>, valor: number) =>
    candidatos.map((c, i) => ({ c, i })).filter(({ c }) => posicoes[c.id] === valor);
  return (
    <Cartao
      titulo="Respostas por pergunta"
      nota="Quantas pessoas marcaram cada alternativa, na ordem da escala (1 a 4; no questionário a ordem é sorteada). As etiquetas indicam a alternativa em que cada candidato está."
    >
      <AreaDicas>
        <div className="grid gap-x-10 gap-y-9 lg:grid-cols-2">
          {a.respostasPorPergunta.map((q) => (
            <div key={q.perguntaId}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{q.tema}</p>
              <p className="mt-1 text-sm font-medium leading-snug">{q.texto}</p>
              {q.total === 0 ? (
                <p className="mt-3 text-xs text-muted">Sem respostas no recorte.</p>
              ) : (
                <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full">
                  {q.alternativas.map((alt, i) =>
                    alt.n === 0 ? null : (
                      <div
                        key={alt.valor}
                        tabIndex={0}
                        data-dica={`Alternativa ${alt.valor}: ${alt.texto}\n${plural(alt.n, "resposta", "respostas")} (${formatPercent((alt.n / q.total) * 100)}%)${ondeEsta(q.posicoes, alt.valor)
                          .map(({ c }) => `\nPosição de ${c.name}`)
                          .join("")}`}
                        className="h-full cursor-default outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ink"
                        style={{ width: `${(alt.n / q.total) * 100}%`, background: TONS_ESCALA[i] }}
                      />
                    ),
                  )}
                </div>
              )}
              <ol className="mt-3 space-y-1.5 text-xs">
                {q.alternativas.map((alt, i) => (
                  <li key={alt.valor} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-[3px] size-2.5 shrink-0 rounded-sm" style={{ background: TONS_ESCALA[i] }} />
                    <span className="flex-1 leading-snug">
                      <span className="text-muted">{alt.valor}.</span> {alt.texto}
                      {ondeEsta(q.posicoes, alt.valor).map(({ c, i: indice }) => (
                        <span key={c.id} className="ml-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-2 px-1.5 py-px align-middle text-[11px] text-muted">
                          <MarcadorCandidato indice={indice} className="size-2" />
                          {c.name}
                        </span>
                      ))}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {alt.n.toLocaleString("pt-BR")} · {q.total ? `${formatPercent((alt.n / q.total) * 100)}%` : "—"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </AreaDicas>
      <Tabela
        cabecalho={["Pergunta", "Alternativa", "Respostas", "%", "Candidato nesta alternativa"]}
        linhas={a.respostasPorPergunta.flatMap((q) =>
          q.alternativas.map((alt) => [
            q.tema,
            `${alt.valor}. ${alt.texto}`,
            alt.n,
            q.total ? `${formatPercent((alt.n / q.total) * 100)}%` : "—",
            ondeEsta(q.posicoes, alt.valor)
              .map(({ c }) => c.name)
              .join(", ") || "—",
          ]),
        )}
      />
    </Cartao>
  );
}

/** Para quem cada pessoa ficou mais próxima: dois grupos (acima de 50% para cada candidato), em número e %. */
export function GraficoMaisProximos({ a, total, candidatos }: { a: Analises; total: number; candidatos: Candidate[] }) {
  const pctDe = (n: number) => (total ? (n / total) * 100 : 0);
  const partes = [
    { chave: candidatos[0].id, n: a.maisProximos[candidatos[0].id], cor: "bg-cand-1", rotulo: candidatos[0].name },
    { chave: "empate", n: a.empates, cor: "bg-surface-3", rotulo: "Empate (50% × 50%)" },
    { chave: candidatos[1].id, n: a.maisProximos[candidatos[1].id], cor: "bg-cand-2", rotulo: candidatos[1].name },
  ];
  return (
    <Cartao
      titulo="Para quem cada pessoa ficou mais próxima"
      nota="Cada participação conta para o candidato que ficou com mais de 50% no resultado da pessoa. Inclui os resultados que apareceram como “equilibrados” na tela (diferença menor que 10 pontos)."
    >
      <div className="grid grid-cols-2 gap-4">
        {candidatos.map((c, i) => {
          const n = a.maisProximos[c.id];
          return (
            <div key={c.id} className={i === 1 ? "text-right" : ""}>
              <p className={`flex items-center gap-2 text-sm font-medium ${i === 1 ? "justify-end" : ""}`}>
                <MarcadorCandidato indice={i} />
                {c.name}
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">{n.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-muted">
                {n === 1 ? "pessoa" : "pessoas"} · <strong className="font-semibold text-ink">{formatPercent(pctDe(n))}%</strong>
              </p>
            </div>
          );
        })}
      </div>
      <AreaDicas className="mt-4">
        <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-track">
          {partes.map((p) =>
            p.n === 0 ? null : (
              <div
                key={p.chave}
                tabIndex={0}
                data-dica={`${p.rotulo}\n${plural(p.n, "pessoa", "pessoas")} (${formatPercent(pctDe(p.n))}%)`}
                className={`h-full cursor-default outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ink ${p.cor}`}
                style={{ width: `${pctDe(p.n)}%` }}
              />
            ),
          )}
        </div>
      </AreaDicas>
      {a.empates > 0 && (
        <p className="mt-2 text-xs text-muted">
          {plural(a.empates, "resultado", "resultados")} exatamente 50% × 50% ({formatPercent(pctDe(a.empates))}%) não {a.empates === 1 ? "entra" : "entram"} em
          nenhum dos lados.
        </p>
      )}
      <Tabela
        cabecalho={["Mais próximo de", "Pessoas", "%"]}
        linhas={partes.filter((p) => p.chave !== "empate" || p.n > 0).map((p) => [p.rotulo, p.n, `${formatPercent(pctDe(p.n))}%`])}
      />
    </Cartao>
  );
}
