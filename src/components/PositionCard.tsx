import type { Position, Question } from "@/lib/schema";
import { candidates } from "@/lib/data";
import { EvidenceList } from "./EvidenceList";

type Props = {
  question: Question;
  candidateId: string;
  position: Position | undefined;
};

const CONFIDENCE_LABELS = { alta: "confiança alta", media: "confiança média" } as const;

/** Posição documentada de um candidato em um tema, com justificativa e fontes. */
export function PositionCard({ question, candidateId, position }: Props) {
  const candidate = candidates.find((c) => c.id === candidateId)!;
  const option = position?.status === "documented" ? question.options.find((o) => o.value === position.value) : undefined;

  return (
    <div className="border-l-2 border-line pl-4 text-sm">
      <p className="font-medium">
        {candidate.name} <span className="font-normal text-muted">{candidate.party}</span>
      </p>

      {position?.status === "documented" && option ? (
        <>
          <p className="mt-2">{option.text}</p>
          <p className="mt-2 leading-relaxed text-muted">{position.summary}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <span className="font-medium">{CONFIDENCE_LABELS[position.confidence]}.</span> {position.rationale}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2">Informação insuficiente</p>
          <p className="mt-2 leading-relaxed text-muted">
            {position?.summary ?? "Não encontramos posição pública documentada sobre este tema."}
          </p>
        </>
      )}

      {position && position.evidence.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-accent">
            {position.evidence.length} {position.evidence.length === 1 ? "fonte" : "fontes"}{" "}
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="mt-3">
            <EvidenceList evidence={position.evidence} />
          </div>
        </details>
      )}
    </div>
  );
}
