"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconeFechar } from "./icon";

/**
 * Janela modal com o <dialog> nativo: prende o foco, fecha com Esc e devolve o foco ao botão que a abriu.
 * O conteúdo só é montado enquanto está aberta.
 */
export function Dialogo({ aberto, aoFechar, titulo, children }: { aberto: boolean; aoFechar: () => void; titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-titulo`}
      onClose={aoFechar}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-3xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      {aberto && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={`${id}-titulo`} className="text-lg font-semibold tracking-tight">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <IconeFechar tamanho={18} />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
