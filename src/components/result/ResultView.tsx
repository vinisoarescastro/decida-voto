import { useState, type RefObject } from "react";
import type { AffinityResult } from "@/lib/affinity";
import { newsItems, questions } from "@/lib/data";
import { NewsList } from "@/components/NewsList";
import { AffinityChart } from "./AffinityChart";
import { ThemesPanel } from "./ThemesPanel";
import { HowCalculated } from "./HowCalculated";
import type { StatusEnvio } from "@/components/quiz/QuizApp";

type Props = {
  result: AffinityResult;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onRestart: () => void;
  onEdit: () => void;
  envio: StatusEnvio | null;
};

const PANELS = [
  { id: "temas", label: "Detalhes por tema" },
  { id: "calculo", label: "Como calculamos" },
  { id: "noticias", label: "Notícias" },
] as const;
type PanelId = (typeof PANELS)[number]["id"];

const MENSAGENS_ENVIO: Record<StatusEnvio, string | null> = {
  enviando: null,
  ok: "Sua participação foi registrada, sem identificação pessoal.",
  repetido: "Este dispositivo já participou recentemente. Esta resposta não entrou nas estatísticas.",
  limite: "Muitas participações a partir desta rede. Esta resposta não entrou nas estatísticas.",
  erro: "Não foi possível registrar sua participação agora. Seu resultado continua válido.",
};

export function ResultView({ result, headingRef, onRestart, onEdit, envio }: Props) {
  const [open, setOpen] = useState<PanelId | null>(null);
  const noComparison = result.comparableCount === 0;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-14 sm:pt-20">
      <h1 ref={headingRef} tabIndex={-1} className="text-sm font-medium text-muted">
        Seu resultado
      </h1>

      {noComparison ? (
        <p className="mt-6 text-lg">
          Ainda não há temas com posições documentadas dos dois candidatos, por isso não é possível calcular a afinidade.
        </p>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Afinidade com suas respostas</p>
          <AffinityChart scores={result.scores} />
          <div className="mt-10 space-y-1.5 text-sm leading-relaxed text-muted">
            <p>
              Baseado em {result.comparableCount} de {questions.length} temas. Em cada tema, 100 pontos são divididos entre
              os dois candidatos: quem está mais perto da sua resposta leva mais.
              {result.similar && " O resultado está equilibrado: a diferença é pequena e está dentro da imprecisão do método."}
            </p>
            <p>Estimativa informativa: não é pesquisa eleitoral nem recomendação de voto.</p>
            {envio && MENSAGENS_ENVIO[envio] && (
              <p role="status" className="pt-2">
                {MENSAGENS_ENVIO[envio]}
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-14 border-t border-line pt-5">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {PANELS.map((panel) => {
            const expanded = open === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                aria-expanded={expanded}
                aria-controls={`painel-${panel.id}`}
                onClick={() => setOpen(expanded ? null : panel.id)}
                className={`py-1 transition-colors ${expanded ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
              >
                {panel.label}
                <span aria-hidden="true" className={`ml-1.5 inline-block text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
            );
          })}
        </div>

        {open && (
          <div id={`painel-${open}`} className="mt-8">
            {open === "temas" && <ThemesPanel result={result} />}
            {open === "calculo" && <HowCalculated result={result} />}
            {open === "noticias" && <NewsList items={newsItems} />}
          </div>
        )}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-ink px-6 py-2.5 font-medium text-bg transition-opacity hover:opacity-85"
        >
          Refazer questionário
        </button>
        <button type="button" onClick={onEdit} className="text-muted transition-colors hover:text-ink">
          Revisar respostas
        </button>
      </div>
    </div>
  );
}
