"use client";

import dynamic from "next/dynamic";

// O questionário é renderizado só no navegador: a ordem das alternativas é sorteada a cada abertura,
// e um sorteio feito no build geraria HTML diferente do que o navegador exibe (erro de hidratação).
const QuizApp = dynamic(() => import("./QuizApp").then((m) => m.QuizApp), {
  ssr: false,
  loading: () => <div aria-busy="true" aria-label="Carregando questionário" className="min-h-[70vh]" />,
});

export function QuizLoader() {
  return <QuizApp />;
}
