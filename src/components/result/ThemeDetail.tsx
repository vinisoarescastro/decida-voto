import { formatPercent, type ThemeResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { PositionCard } from "@/components/PositionCard";
import { Disclosure } from "@/components/ui/Disclosure";

const CORES = ["bg-cand-1", "bg-cand-2"] as const;

export function ThemeDetail({ theme }: { theme: ThemeResult }) {
  const userOption = theme.question.options.find((o) => o.id === theme.userOptionId)!;

  const lateral = theme.comparable ? (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
      {theme.candidates.map((c, i) => (
        <span key={c.candidateId} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`size-2 rounded-full ${CORES[i]}`} />
          <span className="sr-only">{candidates.find((x) => x.id === c.candidateId)!.name}:</span>
          <span className="hidden sm:inline">{candidates.find((x) => x.id === c.candidateId)!.name}</span>
          {formatPercent(c.share! * 100)}%
        </span>
      ))}
    </span>
  ) : (
    "sem dados suficientes"
  );

  return (
    <Disclosure titulo={theme.question.theme} lateral={lateral}>
      <div className="space-y-5">
        <div className="rounded-xl bg-surface-2/70 px-4 py-3 text-sm">
          <p className="text-muted">{theme.question.text}</p>
          <p className="mt-2">
            <span className="text-muted">Sua resposta:</span> <span className="font-medium">{userOption.text}</span>
          </p>
        </div>
        {theme.candidates.map((c) => (
          <PositionCard key={c.candidateId} question={theme.question} candidateId={c.candidateId} position={c.position} />
        ))}
      </div>
    </Disclosure>
  );
}
