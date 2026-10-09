import { formatPercent, type ThemeResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { PositionCard } from "@/components/PositionCard";

export function ThemeDetail({ theme }: { theme: ThemeResult }) {
  const userOption = theme.question.options.find((o) => o.id === theme.userOptionId)!;

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm">
        <span className="font-medium">{theme.question.theme}</span>
        <span className="flex items-center gap-3 text-muted tabular-nums">
          {theme.comparable
            ? theme.candidates
                .map((c) => `${candidates.find((x) => x.id === c.candidateId)!.name} ${formatPercent(c.share! * 100)}%`)
                .join(" · ")
            : "sem dados suficientes"}
          <span aria-hidden="true" className="text-xs transition-transform group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <div className="space-y-6 pb-8 pt-2">
        <div className="text-sm">
          <p className="text-muted">{theme.question.text}</p>
          <p className="mt-3">
            <span className="text-muted">Sua resposta:</span> {userOption.text}
          </p>
        </div>
        {theme.candidates.map((c) => (
          <PositionCard key={c.candidateId} question={theme.question} candidateId={c.candidateId} position={c.position} />
        ))}
      </div>
    </details>
  );
}
