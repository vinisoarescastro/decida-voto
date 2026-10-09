import { formatPercent, type CandidateScore } from "@/lib/affinity";
import { candidates } from "@/lib/data";

/**
 * Barra única dividida entre os dois candidatos (os percentuais somam 100%).
 * Os dois lados usam a mesma cor, por neutralidade; a identidade está nos rótulos acima de cada lado.
 * Um marcador discreto indica o ponto de equilíbrio (50%).
 */
export function AffinityChart({ scores }: { scores: CandidateScore[] }) {
  const [left, right] = scores.map((s) => ({ ...s, candidate: candidates.find((c) => c.id === s.candidateId)! }));

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between gap-6">
        {[left, right].map((side, i) => (
          <div key={side.candidateId} className={i === 1 ? "text-right" : ""}>
            <p className="text-base font-medium sm:text-lg">
              {side.candidate.name}
              <span className="ml-2 text-sm font-normal text-muted">{side.candidate.party}</span>
            </p>
            <p className="mt-1 font-semibold tracking-tight tabular-nums">
              <span className="text-5xl leading-none sm:text-7xl">{formatPercent(side.display)}</span>
              <span className="ml-0.5 text-2xl text-muted sm:text-3xl">%</span>
            </p>
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="relative mt-6">
        <div className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-bar-track">
          {left.display > 0 && (
            <div className="animate-grow h-full rounded-l-full bg-bar" style={{ width: `${left.display}%` }} />
          )}
          {right.display > 0 && <div className="animate-grow-right h-full flex-1 rounded-r-full bg-bar" />}
        </div>
        <span className="absolute -top-1.5 left-1/2 h-6 w-0.5 -translate-x-1/2 rounded-full bg-ink/50" />
        <span className="absolute left-1/2 top-6 -translate-x-1/2 text-xs text-muted">50%</span>
      </div>
    </div>
  );
}
