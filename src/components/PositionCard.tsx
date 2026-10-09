import type { ReactNode } from "react";
import type { Position, Question } from "@/lib/schema";
import { candidates } from "@/lib/data";
import { IconeChevron } from "@/components/ui/Icon";
import { EvidenceList } from "./EvidenceList";

type Props = {
  question: Question;
  candidateId: string;
  position: Position | undefined;
};

const CONFIDENCE_LABELS = { alta: "Confiança alta", media: "Confiança média" } as const;
const BORDAS = ["border-cand-1", "border-cand-2"] as const;

function Expansivel({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-md py-1 text-xs font-medium text-accent hover:underline">
        {rotulo}
        <IconeChevron tamanho={14} className="transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="animate-surgir mt-2">{children}</div>
    </details>
  );
}

/** Posição documentada de um candidato em um tema: alternativa, resumo, justificativa e fontes. */
export function PositionCard({ question, candidateId, position }: Props) {
  const indice = candidates.findIndex((c) => c.id === candidateId);
  const candidate = candidates[indice];
  const option = position?.status === "documented" ? question.options.find((o) => o.value === position.value) : undefined;

  return (
    <div className={`border-l-2 pl-4 text-sm ${BORDAS[indice] ?? "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">
          {candidate.name} <span className="font-normal text-muted">{candidate.party}</span>
        </p>
        {position?.status === "documented" && <span className="text-xs text-muted">{CONFIDENCE_LABELS[position.confidence]}</span>}
      </div>

      {position?.status === "documented" && option ? (
        <>
          <p className="mt-2 font-medium">{option.text}</p>
          <p className="mt-2 leading-relaxed text-muted">{position.summary}</p>
        </>
      ) : (
        <>
          <p className="mt-2 font-medium">Informação insuficiente</p>
          <p className="mt-2 leading-relaxed text-muted">
            {position?.summary ?? "Não encontramos posição pública documentada sobre este tema."}
          </p>
        </>
      )}

      <div className="mt-2 flex flex-col gap-1">
        {position?.status === "documented" && position.rationale && (
          <Expansivel rotulo="Por que esta alternativa?">
            <p className="leading-relaxed text-muted">{position.rationale}</p>
          </Expansivel>
        )}
        {position && position.evidence.length > 0 && (
          <Expansivel rotulo={`${position.evidence.length} ${position.evidence.length === 1 ? "fonte" : "fontes"}`}>
            <EvidenceList evidence={position.evidence} />
          </Expansivel>
        )}
      </div>
    </div>
  );
}
