import { formatPercent } from "@/lib/affinity";
import { AreaDicas } from "./dicas";
import { plural } from "./escalas";

// Formas reutilizadas pelos gráficos do painel: rosca (parte de um todo, até 4 fatias) e barras horizontais
// (contagem por categoria). Cada fatia/barra tem dica ao passar o mouse ou focar pelo teclado.

export type Fatia = { chave: string; rotulo: string; n: number; cor: string };

const RAIO = 15.9155; // circunferência de 100 unidades: o traço de cada fatia é a própria porcentagem
const VAO = 0.6; // ~2 px de espaço entre fatias no tamanho exibido

/** Rosca com o total no centro e legenda ao lado (rótulo, número e %), que também identifica as fatias. */
export function Rosca({ fatias, unidade }: { fatias: Fatia[]; unidade: [string, string] }) {
  const total = fatias.reduce((s, f) => s + f.n, 0);
  const visiveis = fatias.filter((f) => f.n > 0);
  const vao = visiveis.length > 1 ? VAO : 0;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  // Início de cada fatia (soma das anteriores), calculado antes de desenhar.
  const inicios = visiveis.map((_, i) => visiveis.slice(0, i).reduce((s, f) => s + pct(f.n), 0));

  return (
    <AreaDicas className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 42 42" className="size-full -rotate-90" aria-hidden={total === 0}>
          <circle cx="21" cy="21" r={RAIO} fill="none" strokeWidth="5.5" style={{ stroke: "var(--surface-2)" }} />
          {visiveis.map((f, i) => {
            const tamanho = pct(f.n);
            const traco = Math.max(tamanho - vao, 0.001);
            return (
              <circle
                key={f.chave}
                cx="21"
                cy="21"
                r={RAIO}
                fill="none"
                strokeWidth="5.5"
                strokeDasharray={`${traco} ${100 - traco}`}
                strokeDashoffset={-inicios[i]}
                tabIndex={0}
                data-dica={`${f.rotulo}\n${plural(f.n, unidade[0], unidade[1])} (${formatPercent(tamanho)}%)`}
                className="cursor-default outline-none transition-opacity hover:opacity-75 focus-visible:opacity-75"
                style={{ stroke: f.cor }}
              />
            );
          })}
        </svg>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{total.toLocaleString("pt-BR")}</span>
          <span className="text-[11px] text-muted">{total === 1 ? unidade[0] : unidade[1]}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2.5 text-sm">
        {fatias.map((f) => (
          <li key={f.chave} className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ background: f.cor }} />
            <span className="min-w-0 flex-1 leading-snug">{f.rotulo}</span>
            <span className="whitespace-nowrap tabular-nums">
              <strong className="font-semibold">{f.n.toLocaleString("pt-BR")}</strong>
              <span className="ml-1.5 inline-block w-11 text-right text-xs text-muted">{formatPercent(pct(f.n))}%</span>
            </span>
          </li>
        ))}
      </ul>
    </AreaDicas>
  );
}

export type ItemBarra = { chave: string; rotulo: string; n: number; dica?: string };

/** Barras horizontais de contagem, num tom neutro (volume não pertence a nenhum candidato). */
export function BarrasHorizontais({ itens, total, unidade }: { itens: ItemBarra[]; total: number; unidade: [string, string] }) {
  const maximo = Math.max(1, ...itens.map((i) => i.n));
  return (
    <AreaDicas>
      <ul className="space-y-3.5">
        {itens.map((i) => (
          <li
            key={i.chave}
            tabIndex={0}
            data-dica={`${i.rotulo}\n${plural(i.n, unidade[0], unidade[1])} (${formatPercent(total ? (i.n / total) * 100 : 0)}%)${i.dica ? `\n${i.dica}` : ""}`}
            className="group cursor-default rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate">{i.rotulo}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                <strong className="font-semibold text-ink">{i.n.toLocaleString("pt-BR")}</strong> · {formatPercent(total ? (i.n / total) * 100 : 0)}%
              </span>
            </span>
            <span className="mt-1.5 block h-2">
              <span
                className="block h-full rounded-r-[4px] bg-ink/70 transition-colors group-hover:bg-ink group-focus-visible:bg-ink"
                style={{ width: `${Math.max(1, (i.n / maximo) * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </AreaDicas>
  );
}
