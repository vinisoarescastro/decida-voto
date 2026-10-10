import type { ReactNode } from "react";

/**
 * Barra de ações do questionário. No celular fica na base da tela, ao alcance do polegar, respeitando
 * a área segura dos aparelhos com barra de gestos. Ela faz parte do fluxo da página (sticky, não fixed):
 * quando o conteúdo cabe, não sobra rolagem; quando não cabe, a barra acompanha a rolagem sem cobrir
 * o fim do conteúdo. O contêiner precisa ser uma coluna flex que ocupa a altura disponível.
 * Em telas maiores, segue o fluxo normal logo abaixo do conteúdo.
 */
export function BarraAcoes({ children, nota }: { children: ReactNode; nota?: ReactNode }) {
  return (
    <>
      {/* Empurra a barra para a base da tela no celular, com um respiro mínimo acima dela. */}
      <div aria-hidden="true" className="min-h-6 flex-1 muito-baixa:min-h-3 sm:hidden" />
      {/* Transparente (mostra o fundo da página); o desfoque só aparece se algum conteúdo passar por baixo. */}
      <div className="sticky bottom-0 z-20 -mx-5 backdrop-blur-md sm:static sm:mx-0 sm:mt-10 sm:backdrop-blur-none sm:baixa:mt-6">
        <div className="pb-seguro px-5 pt-3 muito-baixa:pt-2 sm:px-0 sm:pt-0">
          {nota}
          <div className="flex items-center gap-3">{children}</div>
        </div>
      </div>
    </>
  );
}
