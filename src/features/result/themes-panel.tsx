import { formatPercent, type AffinityResult, type ThemeResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { Expansivel } from "@/components/ui/disclosure";
import { MarcadorCandidato } from "@/components/ui/text";
import { DetalhePosicao } from "./position-detail";

/** Divergência = distância de 2 ou 3 pontos na escala (concordância ≤ 33,3%). */
const LIMITE_DIVERGENCIA = 1 / 3 + 1e-9;

function ItemTema({ tema }: { tema: ThemeResult }) {
  const resposta = tema.question.options.find((o) => o.id === tema.userOptionId)!;
  const lateral = tema.comparable ? (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
      {tema.candidates.map((c, i) => {
        const nome = candidates.find((x) => x.id === c.candidateId)!.name;
        return (
          <span key={c.candidateId} className="inline-flex items-center gap-1.5">
            <MarcadorCandidato indice={i} className="size-2" />
            <span className="sr-only">{nome}:</span>
            {formatPercent(c.share! * 100)}%
          </span>
        );
      })}
    </span>
  ) : (
    "sem dados suficientes"
  );

  return (
    <Expansivel titulo={tema.question.theme} lateral={lateral}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-surface-2/80 px-4 py-3 text-[15px]">
          <p className="text-muted">{tema.question.text}</p>
          <p className="mt-2">
            <span className="text-muted">Sua resposta:</span> <span className="font-medium">{resposta.text}</span>
          </p>
        </div>
        {tema.candidates.map((c) => (
          <DetalhePosicao key={c.candidateId} pergunta={tema.question} idCandidato={c.candidateId} posicao={c.position} />
        ))}
      </div>
    </Expansivel>
  );
}

export function PainelTemas({ resultado }: { resultado: AffinityResult }) {
  const linhas: { rotulo: string; indice?: number; temas: ThemeResult[] }[] = [
    ...candidates.map((c, i) => ({
      rotulo: `Mais próximo de ${c.name}`,
      indice: i,
      temas: resultado.themes.filter((t) => t.closest === c.id),
    })),
    { rotulo: "Mesma distância", temas: resultado.themes.filter((t) => t.closest === "empate") },
    ...candidates.map((c, i) => ({
      rotulo: `Maior divergência com ${c.name}`,
      indice: i,
      temas: resultado.themes.filter((t) => {
        const a = t.candidates.find((x) => x.candidateId === c.id)?.affinity;
        return t.comparable && a != null && a <= LIMITE_DIVERGENCIA;
      }),
    })),
    { rotulo: "Sem dados suficientes (fora do cálculo)", temas: resultado.themes.filter((t) => !t.comparable) },
  ].filter((l) => l.temas.length > 0);

  return (
    <div className="space-y-8">
      <dl className="divide-y divide-line rounded-2xl border border-line bg-surface/80">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="space-y-2 px-4 py-3.5">
            <dt className="flex items-center gap-2 text-sm text-muted">
              {linha.indice !== undefined && <MarcadorCandidato indice={linha.indice} className="size-2" />}
              {linha.rotulo}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {linha.temas.map((t) => (
                <span key={t.question.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
                  {t.question.theme}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="font-semibold">Comparação tema a tema</h3>
        <p className="mt-1 text-sm text-muted">Toque em um tema para ver sua resposta, a posição de cada candidato e as fontes.</p>
        <div className="mt-2 divide-y divide-line border-y border-line">
          {resultado.themes.map((tema) => (
            <ItemTema key={tema.question.id} tema={tema} />
          ))}
        </div>
      </div>
    </div>
  );
}
