import Image from "next/image";
import { formatPercent, type CandidateScore } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { ANEL_CANDIDATO, COR_CANDIDATO, MarcadorCandidato } from "@/components/ui/text";

/**
 * Barra única dividida entre os dois candidatos (os percentuais somam 100%).
 * Cada lado tem a cor do candidato (violeta / magenta, peso visual equivalente, validadas para daltonismo);
 * a identidade é reforçada pelo nome e pelo marcador acima de cada lado e pelo espaço entre as partes.
 * Um traço discreto marca o ponto de equilíbrio (50%).
 * Acima de cada lado, a foto do candidato: maior para quem ficou mais próximo das respostas. Com resultado
 * equilibrado (liderId null), as duas têm o mesmo tamanho, para não sugerir uma diferença que o método não sustenta.
 */
export function GraficoAfinidade({ placar, liderId }: { placar: CandidateScore[]; liderId: string | null }) {
  const lados = placar.map((s, i) => ({ ...s, indice: i, candidato: candidates.find((c) => c.id === s.candidateId)! }));
  const [esquerda, direita] = lados;

  return (
    <figure>
      <figcaption className="sr-only">
        Afinidade: {lados.map((l) => `${l.candidato.name} ${formatPercent(l.display)}%`).join(", ")}.
      </figcaption>
      <div className="flex items-end justify-between gap-4">
        {lados.map((lado) => (
          <div key={lado.candidateId} className={lado.indice === 1 ? "text-right" : ""}>
            <Image
              src={`/candidatos/${lado.candidateId}.jpg`}
              alt=""
              width={192}
              height={192}
              className={`mb-3 rounded-full object-cover ring-2 ring-offset-2 ring-offset-surface ${ANEL_CANDIDATO[lado.indice]} ${
                lado.indice === 1 ? "ml-auto" : ""
              } ${liderId === null ? "size-16 sm:size-20" : lado.candidateId === liderId ? "size-20 sm:size-28" : "size-12 sm:size-14"}`}
            />
            <p className={`flex items-center gap-2 text-sm font-medium ${lado.indice === 1 ? "justify-end" : ""}`}>
              <MarcadorCandidato indice={lado.indice} />
              {lado.candidato.name}
              <span className="text-xs font-normal text-muted">{lado.candidato.party}</span>
            </p>
            <p aria-hidden="true" className="mt-2 font-semibold tracking-tight tabular-nums">
              <span className="text-[2.75rem] leading-none sm:text-6xl">{formatPercent(lado.display)}</span>
              <span className="ml-0.5 text-xl text-muted sm:text-2xl">%</span>
            </p>
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="relative mt-6">
        <div className="flex h-3.5 gap-1 overflow-hidden rounded-full bg-track">
          {esquerda.display > 0 && (
            <div className={`animate-crescer h-full rounded-l-full ${COR_CANDIDATO[0]}`} style={{ width: `${esquerda.display}%` }} />
          )}
          {direita.display > 0 && <div className={`animate-crescer-direita h-full flex-1 rounded-r-full ${COR_CANDIDATO[1]}`} />}
        </div>
        <span className="absolute -bottom-2.5 left-1/2 h-2 w-px -translate-x-1/2 bg-muted/60" />
      </div>
      <p aria-hidden="true" className="mt-3 text-center text-[11px] text-muted">
        50%
      </p>
    </figure>
  );
}
