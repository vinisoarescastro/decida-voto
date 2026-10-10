import Link from "next/link";
import { IconeFechar } from "@/components/ui/icon";

/**
 * Barra superior do questionário em "modo foco": progresso em segmentos (um por pergunta)
 * e um botão para sair. Segmentos escuros = perguntas respondidas.
 */
export function BarraProgresso({ atual, total, respondidas }: { atual: number; total: number; respondidas: boolean[] }) {
  return (
    <div className="sticky top-0 z-10 -mx-5 bg-bg/90 px-5 pb-3 pt-4 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium tabular-nums">
          Pergunta {atual + 1} <span className="text-muted">de {total}</span>
        </p>
        <Link
          href="/"
          aria-label="Sair do questionário"
          className="-mr-2 grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <IconeFechar />
        </Link>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do questionário"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={respondidas.filter(Boolean).length}
        aria-valuetext={`${respondidas.filter(Boolean).length} de ${total} perguntas respondidas`}
        className="mt-2 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {respondidas.map((r, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-colors duration-300 ${
              r ? "bg-ink" : i === atual ? "bg-ink/30" : "bg-track"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
