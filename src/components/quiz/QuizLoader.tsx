"use client";

import dynamic from "next/dynamic";

/** Esqueleto exibido enquanto o questionário carrega (evita tela vazia e salto de layout). */
function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando questionário" className="mx-auto max-w-2xl px-6 pt-14 sm:pt-20">
      <div className="animate-pulsar space-y-4">
        <div className="h-8 w-2/3 rounded-lg bg-surface-2" />
        <div className="h-4 w-full rounded bg-surface-2" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

// O questionário é renderizado só no navegador: a ordem das alternativas é sorteada a cada abertura,
// e um sorteio feito no build geraria HTML diferente do que o navegador exibe (erro de hidratação).
const QuizApp = dynamic(() => import("./QuizApp").then((m) => m.QuizApp), {
  ssr: false,
  loading: Carregando,
});

export function QuizLoader() {
  return <QuizApp />;
}
