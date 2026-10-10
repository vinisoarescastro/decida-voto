import type { Evidence } from "@/lib/schema";
import { EVIDENCE_TYPE_LABELS, formatDate } from "@/lib/data";
import { Etiqueta } from "@/components/ui/disclosure";
import { IconeExterno } from "@/components/ui/icon";

export function ListaFontes({ fontes }: { fontes: Evidence[] }) {
  if (fontes.length === 0) return null;
  return (
    <ul className="space-y-4">
      {fontes.map((f) => (
        <li key={f.url} className="text-sm leading-relaxed">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <Etiqueta>{EVIDENCE_TYPE_LABELS[f.type]}</Etiqueta>
            {f.publisher} · {formatDate(f.publishedAt)}
          </p>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-start gap-1.5 text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
          >
            {f.title}
            <IconeExterno tamanho={14} className="mt-1 shrink-0 text-muted" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <p className="mt-1 text-muted">{f.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
