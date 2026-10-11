"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { formatPercent } from "@/lib/affinity";

// Gráfico de linhas do painel (SVG + HTML). Segue as mesmas regras dos demais: linha de 2 px com junção
// arredondada, um eixo só, grade em linha fina, legenda fora (no cartão) e tabela com os mesmos valores.
// A mira vertical acompanha o ponteiro (ou as setas do teclado) e a dica lista todas as séries daquele dia.

export type SerieLinha = { id: string; nome: string; cor: string; valores: (number | null)[] };

type Props = {
  rotulosX: string[];
  series: SerieLinha[];
  /** Topo do eixo Y. */
  maximo: number;
  /** Valores com linha de grade (inclua o 0). */
  marcas: number[];
  /** Linha de referência mais forte (ex.: 50%). */
  referencia?: number;
  unidade?: "%" | "";
  /** Linhas extras da dica, por dia (ex.: participações e valor do dia). */
  detalhes?: string[][];
  rotulo: string;
};

const fmt = (v: number, unidade: "%" | "") => (unidade === "%" ? `${formatPercent(v)}%` : v.toLocaleString("pt-BR"));

export function GraficoLinhas({ rotulosX, series, maximo, marcas, referencia, unidade = "", detalhes, rotulo }: Props) {
  const [mira, setMira] = useState<{ i: number; left: number; top: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const n = rotulosX.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (Math.min(v, maximo) / maximo) * 100;
  const indice = mira?.i ?? null;

  // Trechos contínuos de cada série (um valor nulo interrompe a linha).
  const trechos = (valores: (number | null)[]) => {
    const saida: string[] = [];
    let atual: string[] = [];
    valores.forEach((v, i) => {
      if (v === null) {
        if (atual.length) saida.push(atual.join(" "));
        atual = [];
      } else atual.push(`${x(i)},${y(v)}`);
    });
    if (atual.length) saida.push(atual.join(" "));
    return saida;
  };

  /** Posiciona a mira no dia `i` e a dica acima do gráfico, sem sair da tela. */
  function mirar(i: number) {
    const r = area.current?.getBoundingClientRect();
    if (!r || n === 0) return;
    const alvo = Math.max(0, Math.min(n - 1, i));
    const left = Math.min(Math.max(r.left + (x(alvo) / 100) * r.width, 100), window.innerWidth - 100);
    setMira({ i: alvo, left, top: r.top - 8 });
  }

  function apontar(clientX: number) {
    const r = area.current?.getBoundingClientRect();
    if (r && n > 0) mirar(Math.round(((clientX - r.left) / r.width) * (n - 1)));
  }

  function teclado(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      mirar((indice ?? n - 1) + (e.key === "ArrowLeft" ? -1 : 1));
    } else if (e.key === "Escape") setMira(null);
  }

  const ultimo = (valores: (number | null)[]) => {
    for (let i = valores.length - 1; i >= 0; i--) if (valores[i] !== null) return i;
    return -1;
  };

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2">
      <div aria-hidden="true" className="relative h-44 w-9 text-right text-[11px] tabular-nums text-muted">
        {marcas.map((m) => (
          <span key={m} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(m)}%` }}>
            {fmt(m, unidade)}
          </span>
        ))}
      </div>
      <div
        ref={area}
        role="img"
        tabIndex={0}
        aria-label={`${rotulo}. Use as setas para percorrer os dias; os valores também estão na tabela.`}
        className="relative h-44 cursor-crosshair touch-pan-y rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
        onPointerMove={(e) => apontar(e.clientX)}
        onPointerDown={(e) => apontar(e.clientX)}
        onPointerLeave={() => setMira(null)}
        onFocus={() => mirar(n - 1)}
        onBlur={() => setMira(null)}
        onKeyDown={teclado}
      >
        {marcas.map((m) => (
          <span key={m} aria-hidden="true" className={`absolute inset-x-0 h-px ${m === referencia ? "bg-ink/30" : "bg-line"}`} style={{ top: `${y(m)}%` }} />
        ))}
        {referencia !== undefined && !marcas.includes(referencia) && (
          <span aria-hidden="true" className="absolute inset-x-0 h-px bg-ink/30" style={{ top: `${y(referencia)}%` }} />
        )}
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {series.map((s) =>
            trechos(s.valores).map((pontos, i) => (
              <polyline
                key={`${s.id}-${i}`}
                points={pontos}
                fill="none"
                style={{ stroke: s.cor }}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}
        </svg>
        {indice !== null && <span aria-hidden="true" className="absolute inset-y-0 w-px -translate-x-1/2 bg-ink/40" style={{ left: `${x(indice)}%` }} />}
        {series.map((s) => {
          const i = indice ?? ultimo(s.valores);
          const v = i >= 0 ? s.valores[i] : null;
          return v === null || v === undefined ? null : (
            <span
              key={s.id}
              aria-hidden="true"
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
              style={{ left: `${x(i)}%`, top: `${y(v)}%`, background: s.cor }}
            />
          );
        })}
      </div>
      <span />
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted">
        <span>{rotulosX[0]}</span>
        {n > 2 && <span>{rotulosX[Math.floor((n - 1) / 2)]}</span>}
        {n > 1 && <span>{rotulosX[n - 1]}</span>}
      </div>

      {mira &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 min-w-40 max-w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink shadow-lg"
            style={{ left: mira.left, top: mira.top }}
          >
            <p className="font-semibold">{rotulosX[mira.i]}</p>
            {series.map((s) => (
              <p key={s.id} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: s.cor }} />
                  {s.nome}
                </span>
                <span className="tabular-nums">{s.valores[mira.i] === null ? "—" : fmt(s.valores[mira.i]!, unidade)}</span>
              </p>
            ))}
            {detalhes?.[mira.i]?.map((d) => (
              <p key={d} className="text-muted">
                {d}
              </p>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
