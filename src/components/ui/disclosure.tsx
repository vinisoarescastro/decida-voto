import type { ReactNode } from "react";
import { IconeChevronBaixo } from "./icon";

// Bloco expansível com <details> nativo: funciona com teclado e leitores de tela, sem JavaScript.

export function Expansivel({
  titulo,
  lateral,
  children,
}: {
  titulo: ReactNode;
  /** Resumo exibido à direita do título (contagens, percentuais). */
  lateral?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group">
      <summary className="-mx-3 flex min-h-14 cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl px-3 py-3 text-[15px] transition-colors hover:bg-surface-2/80">
        <span className="font-medium">{titulo}</span>
        <span className="flex items-center gap-3 text-sm text-muted">
          {lateral}
          <IconeChevronBaixo className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>
      <div className="animate-surgir pb-6 pt-2">{children}</div>
    </details>
  );
}

/** Ligação discreta que abre um conteúdo secundário (justificativa, fontes). */
export function MaisDetalhes({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex min-h-9 cursor-pointer items-center gap-1 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        {rotulo}
        <IconeChevronBaixo tamanho={16} className="transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="animate-surgir mt-2">{children}</div>
    </details>
  );
}

/** Rótulo pequeno de categoria. */
export function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink">{children}</span>;
}
