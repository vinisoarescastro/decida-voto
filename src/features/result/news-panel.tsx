import type { NewsItem } from "@/lib/schema";
import { NEWS_TYPE_LABELS, candidateName, formatDate, questions } from "@/lib/data";
import { Etiqueta, Expansivel } from "@/components/ui/disclosure";
import { IconeExterno } from "@/components/ui/icon";

/**
 * Notícias agrupadas por tema, na ordem do questionário. Conteúdo de src/data/news.json
 * (curadoria manual com links verificados). Uma integração futura (API/RSS) só precisa produzir NewsItem.
 */
export function PainelNoticias({ itens }: { itens: NewsItem[] }) {
  if (itens.length === 0) return <p className="text-sm text-muted">Conteúdos em curadoria. Nenhuma notícia publicada ainda.</p>;

  const grupos = questions
    .map((q) => ({ pergunta: q, itens: itens.filter((n) => n.questionId === q.id) }))
    .filter((g) => g.itens.length > 0);

  return (
    <div>
      <p className="text-[15px] text-muted">
        Selecionadas por tema, com o mesmo critério para os dois candidatos, e não com base no seu resultado.
      </p>
      <div className="mt-2 divide-y divide-line border-y border-line">
        {grupos.map((g) => (
          <Expansivel
            key={g.pergunta.id}
            titulo={g.pergunta.theme}
            lateral={
              <span className="tabular-nums">
                {g.itens.length} {g.itens.length === 1 ? "conteúdo" : "conteúdos"}
              </span>
            }
          >
            <ul className="space-y-6">
              {g.itens.map((n) => (
                <li key={n.url}>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <Etiqueta>{NEWS_TYPE_LABELS[n.type]}</Etiqueta>
                    {n.publisher} · <time dateTime={n.publishedAt ?? undefined}>{formatDate(n.publishedAt)}</time>
                  </p>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-start gap-1.5 font-medium leading-snug underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  >
                    {n.title}
                    <IconeExterno tamanho={14} className="mt-1 shrink-0 text-muted" />
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{n.summary}</p>
                  {n.candidates.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted">Menciona: {n.candidates.map(candidateName).join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
          </Expansivel>
        ))}
      </div>
    </div>
  );
}
