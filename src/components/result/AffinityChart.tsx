import { formatPercent, type CandidateScore } from "@/lib/affinity";
import { candidates } from "@/lib/data";

/**
 * Barra única dividida entre os dois candidatos (os percentuais somam 100%).
 * Cada lado tem uma cor própria (violeta e magenta, de peso visual equivalente e validadas para daltonismo),
 * reforçada pelo nome e pelo marcador colorido acima de cada lado e por um espaço entre as partes.
 * Um traço discreto marca o ponto de equilíbrio (50%).
 */
const CORES = ["bg-cand-1", "bg-cand-2"] as const;

export function AffinityChart({ scores }: { scores: CandidateScore[] }) {
  const [left, right] = scores.map((s, i) => ({ ...s, cor: CORES[i], candidate: candidates.find((c) => c.id === s.candidateId)! }));

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        {[left, right].map((side, i) => (
          <div key={side.candidateId} className={i === 1 ? "text-right" : ""}>
            <p className={`flex items-center gap-2 text-sm font-medium sm:text-base ${i === 1 ? "justify-end" : ""}`}>
              <span aria-hidden="true" className={`size-2.5 rounded-full ${side.cor}`} />
              {side.candidate.name}
              <span className="text-xs font-normal text-muted">{side.candidate.party}</span>
            </p>
            <p className="mt-2 font-semibold tracking-tight tabular-nums">
              <span className="text-5xl leading-none sm:text-6xl">{formatPercent(side.display)}</span>
              <span className="ml-0.5 text-xl text-muted sm:text-2xl">%</span>
            </p>
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="relative mt-6">
        <div className="flex h-3 gap-1 overflow-hidden rounded-full bg-bar-track">
          {left.display > 0 && <div className={`animate-grow h-full rounded-l-full ${left.cor}`} style={{ width: `${left.display}%` }} />}
          {right.display > 0 && <div className={`animate-grow-right h-full flex-1 rounded-r-full ${right.cor}`} />}
        </div>
        <span className="absolute -bottom-2.5 left-1/2 h-2 w-px -translate-x-1/2 bg-muted/60" />
      </div>
      <p aria-hidden="true" className="mt-3 text-center text-[11px] text-muted">
        50%
      </p>
    </div>
  );
}
