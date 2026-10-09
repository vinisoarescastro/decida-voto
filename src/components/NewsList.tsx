import type { NewsItem } from "@/lib/schema";
import { NEWS_TYPE_LABELS, candidateName, formatDate, questions } from "@/lib/data";

/**
 * Lista de notícias agrupadas por tema, na ordem do questionário.
 * O conteúdo vem de src/data/news.json (curadoria manual com links verificados).
 * Para uma integração futura com API/RSS, basta produzir itens no mesmo formato (NewsItem).
 */
export function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Conteúdos em curadoria. Nenhuma notícia publicada ainda.</p>;
  }

  const groups = questions
    .map((q) => ({ question: q, items: items.filter((n) => n.questionId === q.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <p className="mb-2 text-sm text-muted">
        Selecionadas por tema, com o mesmo critério para os dois candidatos, e não com base no seu resultado.
      </p>
      <div className="divide-y divide-line border-y border-line">
        {groups.map((group) => (
          <details key={group.question.id} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm">
              <h3 className="font-medium">{group.question.theme}</h3>
              <span className="flex items-center gap-3 text-muted">
                {group.items.length}
                <span aria-hidden="true" className="text-xs transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <ul className="space-y-6 pb-8 pt-2">
              {group.items.map((n) => (
                <li key={n.url} className="text-sm">
                  <p className="text-xs text-muted">
                    {NEWS_TYPE_LABELS[n.type]} · {n.publisher} ·{" "}
                    <time dateTime={n.publishedAt ?? undefined}>{formatDate(n.publishedAt)}</time>
                  </p>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-medium underline decoration-line underline-offset-4 hover:decoration-ink"
                  >
                    {n.title}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                  <p className="mt-1.5 leading-relaxed text-muted">{n.summary}</p>
                  {n.candidates.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted">Menciona: {n.candidates.map(candidateName).join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
