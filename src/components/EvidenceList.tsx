import type { Evidence } from "@/lib/schema";
import { EVIDENCE_TYPE_LABELS, formatDate } from "@/lib/data";

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <ul className="space-y-4">
      {evidence.map((e) => (
        <li key={e.url} className="text-xs leading-relaxed">
          <p className="text-muted">
            {EVIDENCE_TYPE_LABELS[e.type]} · {e.publisher} · {formatDate(e.publishedAt)}
          </p>
          <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
            {e.title}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <p className="mt-1 text-muted">{e.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
