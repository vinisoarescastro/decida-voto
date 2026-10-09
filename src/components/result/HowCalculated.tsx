import Link from "next/link";
import { formatPercent, type AffinityResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";

const points = (share: number) => formatPercent(share * 100);
const CORES = ["bg-cand-1", "bg-cand-2"] as const;

export function HowCalculated({ result }: { result: AffinityResult }) {
  return (
    <section aria-labelledby="calculo" className="space-y-8 text-sm">
      <h2 id="calculo" className="sr-only">
        Como o seu resultado foi calculado
      </h2>
      <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-muted marker:text-muted">
        <li>As 4 alternativas de cada pergunta foram ordenadas numa escala de 1 a 4.</li>
        <li>Cada candidato recebeu o valor da alternativa mais próxima da sua posição documentada em fontes públicas.</li>
        <li>
          Em cada tema, 100 pontos são divididos entre os dois: cada candidato recebe a distância do outro até a sua
          resposta, dividida pela soma das duas distâncias. Quem está mais perto leva mais; distâncias iguais dão 50 × 50.
        </li>
        <li>
          O resultado é a média dos pontos, só com os temas documentados para os dois candidatos. Por isso soma 100%.
        </li>
      </ol>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/80 px-4">
        <table className="w-full min-w-[460px] text-left tabular-nums">
          <caption className="sr-only">Cálculo detalhado por tema</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line [&>th]:pt-3">
              <th scope="col" className="py-2 pr-3 font-normal">Tema</th>
              <th scope="col" className="px-3 py-2 text-right font-normal">Você</th>
              {candidates.map((c, i) => (
                <th key={c.id} scope="col" className="py-2 pl-3 text-right font-normal">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <span aria-hidden="true" className={`size-2 rounded-full ${CORES[i]}`} />
                    {c.name}
                  </span>
                  <span className="block text-[11px]">posição → pontos</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {result.themes.map((t) => (
              <tr key={t.question.id} className={t.comparable ? "" : "text-muted"}>
                <th scope="row" className="py-2 pr-3 font-normal">
                  {t.question.theme}
                </th>
                <td className="px-3 py-2 text-right">{t.userValue}</td>
                {t.candidates.map((c) => (
                  <td key={c.candidateId} className="py-2 pl-3 text-right">
                    {c.position?.status === "documented" ? (
                      <>
                        {c.position.value}
                        {c.share !== null && <span className="text-muted"> → {points(c.share)}</span>}
                      </>
                    ) : (
                      "sem dados"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong font-semibold [&>*]:pb-3">
              <th scope="row" className="py-2 pr-3" colSpan={2}>
                Média ({result.comparableCount} temas)
              </th>
              {result.scores.map((s) => (
                <td key={s.candidateId} className="py-2 pl-3 text-right">
                  {formatPercent(s.display)}%
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="leading-relaxed text-muted">
        <span className="font-medium text-ink">Concordância absoluta.</span> Sem dividir os pontos entre os dois, suas
        respostas coincidem{" "}
        {result.scores
          .map((s) => `${formatPercent(s.agreement)}% com ${candidates.find((c) => c.id === s.candidateId)!.name}`)
          .join(" e ")}
        . Nessa medida, 100% significa escolher a mesma alternativa do candidato em todos os temas, e cada alternativa de
        distância reduz 33,3 pontos.
      </p>

      <p className="text-xs text-muted">
        Linhas em cinza ficam fora do cálculo por falta de posição documentada.{" "}
        <Link href="/metodologia/" className="underline underline-offset-4 hover:text-ink">
          Metodologia completa
        </Link>
      </p>
    </section>
  );
}
