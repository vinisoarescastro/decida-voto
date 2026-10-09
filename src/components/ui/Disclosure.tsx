import type { ReactNode } from "react";
import { IconeChevron } from "./Icon";

// Bloco expansível padrão (<details> nativo: acessível por teclado e leitores de tela sem JavaScript).

type Props = {
  titulo: ReactNode;
  /** Informação resumida exibida à direita do título (ex.: contagem, percentuais). */
  lateral?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Disclosure({ titulo, lateral, children, className = "" }: Props) {
  return (
    <details className={`group ${className}`}>
      <summary className="-mx-3 flex min-h-14 cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-surface-2/70">
        <span className="font-medium">{titulo}</span>
        <span className="flex items-center gap-3 text-muted">
          {lateral}
          <IconeChevron className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>
      <div className="animate-surgir pb-8 pt-3">{children}</div>
    </details>
  );
}

/** Rótulo pequeno para categorias (tipo de fonte, tema etc.). */
export function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink">{children}</span>;
}
