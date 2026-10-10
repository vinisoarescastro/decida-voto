import type { ReactNode } from "react";

/**
 * Barra de ações do questionário. No celular fica fixa na base da tela, ao alcance do polegar,
 * respeitando a área segura dos aparelhos com barra de gestos. Em telas maiores, segue o fluxo da página.
 * O conteúdo acima precisa reservar espaço (ver ESPACO_BARRA).
 */
export function BarraAcoes({ children, nota }: { children: ReactNode; nota?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/92 backdrop-blur-md sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
      <div className="pb-seguro mx-auto max-w-2xl px-5 pt-3 sm:px-0 sm:pt-0">
        {nota}
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </div>
  );
}

/** Espaço reservado no fim do conteúdo para a barra fixa (só botões) não cobrir nada no celular. */
export const ESPACO_BARRA = "pb-32 sm:pb-0";
/** Idem, para a barra com nota de texto acima dos botões (tela de perfil). */
export const ESPACO_BARRA_COM_NOTA = "pb-64 sm:pb-0";
