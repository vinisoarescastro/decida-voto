"use client";

import dynamic from "next/dynamic";

/** Esqueleto exibido enquanto o questionário carrega (evita tela vazia e salto de layout). */
function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando questionário" className="mx-auto w-full max-w-2xl px-5 pt-8 sm:px-6 sm:pt-14">
      <div className="animate-pulsar space-y-4">
        <div className="h-3 w-24 rounded bg-surface-3" />
        <div className="h-9 w-3/4 rounded-lg bg-surface-3" />
        <div className="h-4 w-full rounded bg-surface-2" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-13 rounded-2xl bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

// O questionário roda só no navegador: a ordem das alternativas é sorteada a cada abertura, e um
// sorteio feito no build geraria HTML diferente do exibido (erro de hidratação).
const Fluxo = dynamic(() => import("./quiz-flow").then((m) => m.FluxoQuestionario), {
  ssr: false,
  loading: Carregando,
});

export function CarregadorQuestionario() {
  return <Fluxo />;
}
