import { useState, type RefObject } from "react";
import type { AffinityResult } from "@/lib/affinity";
import { newsItems, questions } from "@/lib/data";
import { NewsList } from "@/components/NewsList";
import { Button } from "@/components/ui/Button";
import { IconeCheck, IconeChevron, IconeInfo, IconeRefazer } from "@/components/ui/Icon";
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
  const mensagem = envio ? MENSAGENS_ENVIO[envio] : null;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-14 sm:pt-20">
      <div className="animate-surgir">
        <h1 ref={headingRef} tabIndex={-1} className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Seu resultado
        </h1>

        {noComparison ? (
          <p className="mt-4 text-lg">
            Ainda não há temas com posições documentadas dos dois candidatos, por isso não é possível calcular a afinidade.
          </p>
        ) : (
          <>
            <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Afinidade com suas respostas</p>
            <div className="mt-8 rounded-3xl border border-line bg-surface/90 p-6 shadow-card sm:p-8">
              <AffinityChart scores={result.scores} />
              {result.similar && (
                <p className="mt-6 flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm">
                  <IconeInfo className="mt-0.5 shrink-0 text-accent" />
                  Resultado equilibrado: a diferença é pequena e está dentro da imprecisão do método.
                </p>
              )}
            </div>
            <div className="mt-6 space-y-1.5 text-sm leading-relaxed text-muted">
              <p>
                Baseado em {result.comparableCount} de {questions.length} temas. Em cada tema, 100 pontos são divididos
                entre os dois candidatos: quem está mais perto da sua resposta leva mais.
              </p>
              <p>Estimativa informativa: não é pesquisa eleitoral nem recomendação de voto.</p>
            </div>
          </>
        )}

        {mensagem && (
          <p role="status" className="animate-surgir mt-5 flex items-start gap-2 text-sm text-muted">
            {envio === "ok" ? (
              <IconeCheck className="mt-0.5 shrink-0 text-success" />
            ) : (
              <IconeInfo className="mt-0.5 shrink-0" />
            )}
            {mensagem}
          </p>
        )}
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <div className="flex flex-wrap gap-2">
          {PANELS.map((panel) => {
            const expanded = open === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                aria-expanded={expanded}
                aria-controls={`painel-${panel.id}`}
                onClick={() => setOpen(expanded ? null : panel.id)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-[background-color,border-color,color] duration-150 active:scale-[0.98] ${
                  expanded
                    ? "border-accent bg-accent-soft font-medium text-ink"
                    : "border-line-strong bg-surface/80 text-muted hover:border-ink/30 hover:text-ink"
                }`}
              >
                {panel.label}
                <IconeChevron tamanho={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              </button>
            );
          })}
        </div>

        {open && (
          <div id={`painel-${open}`} key={open} className="animate-surgir mt-8">
            {open === "temas" && <ThemesPanel result={result} />}
            {open === "calculo" && <HowCalculated result={result} />}
            {open === "noticias" && <NewsList items={newsItems} />}
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Button onClick={onRestart}>
          <IconeRefazer />
          Refazer questionário
        </Button>
        <Button variante="ghost" onClick={onEdit}>
          Revisar respostas
        </Button>
      </div>
    </div>
  );
}
