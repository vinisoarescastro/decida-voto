import type { ReactNode } from "react";

// Tipografia e blocos de conteúdo recorrentes.

/** Linha de contexto acima de títulos (ex.: "Seu resultado", "Etapa 1 de 2"). */
export function Sobretitulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-muted ${className}`}>{children}</p>;
}

/** Cartão de superfície elevada. */
export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface/90 shadow-lg ${className}`}>{children}</div>;
}

/** Marcador de cor de um candidato (identidade nos gráficos; sempre acompanhado do nome). */
export function MarcadorCandidato({ indice, className = "" }: { indice: number; className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-full ${indice === 0 ? "bg-cand-1" : "bg-cand-2"} ${className}`} />;
}

export const COR_CANDIDATO = ["bg-cand-1", "bg-cand-2"] as const;
export const BORDA_CANDIDATO = ["border-cand-1", "border-cand-2"] as const;
export const ANEL_CANDIDATO = ["ring-cand-1", "ring-cand-2"] as const;

/** Sumário de atalhos para as seções de uma página longa. */
export function Sumario({ itens }: { itens: { id: string; rotulo: string }[] }) {
  return (
    <nav aria-label="Nesta página">
      <p className="text-xs font-medium text-muted">Nesta página</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {itens.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface/80 px-3.5 text-sm text-muted transition-colors hover:border-ink/40 hover:text-ink"
            >
              {i.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
