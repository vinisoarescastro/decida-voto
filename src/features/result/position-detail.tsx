import type { Position, Question } from "@/lib/schema";
import { candidates } from "@/lib/data";
import { MaisDetalhes } from "@/components/ui/disclosure";
import { BORDA_CANDIDATO } from "@/components/ui/text";
import { ListaFontes } from "./evidence-list";

const CONFIANCA = { alta: "Confiança alta", media: "Confiança média" } as const;

/** Posição documentada de um candidato num tema: alternativa, resumo e, sob demanda, justificativa e fontes. */
export function DetalhePosicao({ pergunta, idCandidato, posicao }: { pergunta: Question; idCandidato: string; posicao: Position | undefined }) {
  const indice = candidates.findIndex((c) => c.id === idCandidato);
  const candidato = candidates[indice];
  const alternativa = posicao?.status === "documented" ? pergunta.options.find((o) => o.value === posicao.value) : undefined;

  return (
    <div className={`border-l-2 pl-4 ${BORDA_CANDIDATO[indice] ?? "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">
          {candidato.name} <span className="text-sm font-normal text-muted">{candidato.party}</span>
        </p>
        {posicao?.status === "documented" && <span className="text-xs text-muted">{CONFIANCA[posicao.confidence]}</span>}
      </div>

      {posicao?.status === "documented" && alternativa ? (
        <>
          <p className="mt-2 font-medium">{alternativa.text}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{posicao.summary}</p>
        </>
      ) : (
        <>
          <p className="mt-2 font-medium">Informação insuficiente</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {posicao?.summary ?? "Não encontramos posição pública documentada sobre este tema."}
          </p>
        </>
      )}

      <div className="mt-2 flex flex-col">
        {posicao?.status === "documented" && posicao.rationale && (
          <MaisDetalhes rotulo="Por que esta alternativa?">
            <p className="text-sm leading-relaxed text-muted">{posicao.rationale}</p>
          </MaisDetalhes>
        )}
        {posicao && posicao.evidence.length > 0 && (
          <MaisDetalhes rotulo={`${posicao.evidence.length} ${posicao.evidence.length === 1 ? "fonte" : "fontes"}`}>
            <ListaFontes fontes={posicao.evidence} />
          </MaisDetalhes>
        )}
      </div>
    </div>
  );
}
