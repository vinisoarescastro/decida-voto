import type { Evidence } from "@/lib/schema";
import { EVIDENCE_TYPE_LABELS, formatDate } from "@/lib/data";
import { Etiqueta } from "@/components/ui/Disclosure";
import { IconeExterno } from "@/components/ui/Icon";

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <ul className="space-y-4">
      {evidence.map((e) => (
        <li key={e.url} className="text-xs leading-relaxed">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
            <Etiqueta>{EVIDENCE_TYPE_LABELS[e.type]}</Etiqueta>
            {e.publisher} · {formatDate(e.publishedAt)}
          </p>
          <a
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-start gap-1.5 text-sm text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
          >
            {e.title}
            <IconeExterno tamanho={13} className="mt-1 shrink-0 text-muted" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <p className="mt-1 text-muted">{e.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
