import Link from "next/link";
import { formatPercent, type AffinityResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { MarcadorCandidato } from "@/components/ui/text";

const pontos = (parte: number) => formatPercent(parte * 100);

/** Explica o cálculo com os números da própria pessoa. No celular vira lista; em telas maiores, tabela. */
export function ComoCalculamos({ resultado }: { resultado: AffinityResult }) {
  return (
    <section aria-labelledby="calculo" className="space-y-6 text-[15px]">
      <h3 id="calculo" className="sr-only">
        Como o seu resultado foi calculado
      </h3>
      <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-muted marker:text-muted">
        <li>As 4 alternativas de cada pergunta foram ordenadas numa escala de 1 a 4.</li>
        <li>Cada candidato recebeu o valor da alternativa mais próxima da sua posição documentada em fontes públicas.</li>
        <li>
          Em cada tema, 100 pontos são divididos entre os dois: cada candidato recebe a distância do outro até a sua
          resposta, dividida pela soma das duas distâncias. Quem está mais perto leva mais; distâncias iguais dão 50 × 50.
        </li>
        <li>O resultado é a média dos pontos, só com os temas documentados para os dois candidatos. Por isso soma 100%.</li>
      </ol>

      {/* Celular: lista compacta, sem rolagem lateral. */}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface/80 sm:hidden">
        {resultado.themes.map((t) => (
          <li key={t.question.id} className={`px-4 py-3 ${t.comparable ? "" : "text-muted"}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{t.question.theme}</span>
              <span className="text-xs text-muted">você: {t.userValue}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-muted">
              {t.candidates.map((c, i) => (
                <span key={c.candidateId} className="inline-flex items-center gap-1.5">
                  <MarcadorCandidato indice={i} className="size-2" />
                  {c.position?.status === "documented" ? `${c.position.value} → ${c.share !== null ? pontos(c.share) : "—"}` : "sem dados"}
                </span>
              ))}
            </div>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 px-4 py-3 font-semibold">
          <span>Média ({resultado.comparableCount} temas)</span>
          <span className="flex gap-4 tabular-nums">
            {resultado.scores.map((s, i) => (
              <span key={s.candidateId} className="inline-flex items-center gap-1.5">
                <MarcadorCandidato indice={i} className="size-2" />
                {formatPercent(s.display)}%
              </span>
            ))}
          </span>
        </li>
      </ul>

      {/* Telas maiores: tabela completa. */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface/80 px-4 sm:block">
        <table className="w-full text-left text-sm tabular-nums">
          <caption className="sr-only">Cálculo detalhado por tema</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-3 pr-3 font-normal">Tema</th>
              <th scope="col" className="px-3 py-3 text-right font-normal">Você</th>
              {candidates.map((c, i) => (
                <th key={c.id} scope="col" className="py-3 pl-3 text-right font-normal">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <MarcadorCandidato indice={i} className="size-2" />
                    {c.name}
                  </span>
                  <span className="block text-[11px]">posição → pontos</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {resultado.themes.map((t) => (
              <tr key={t.question.id} className={t.comparable ? "" : "text-muted"}>
                <th scope="row" className="py-2.5 pr-3 font-normal">
                  {t.question.theme}
                </th>
                <td className="px-3 py-2.5 text-right">{t.userValue}</td>
                {t.candidates.map((c) => (
                  <td key={c.candidateId} className="py-2.5 pl-3 text-right">
                    {c.position?.status === "documented" ? (
                      <>
                        {c.position.value}
                        {c.share !== null && <span className="text-muted"> → {pontos(c.share)}</span>}
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
            <tr className="border-t border-line-strong font-semibold">
              <th scope="row" className="py-3 pr-3" colSpan={2}>
                Média ({resultado.comparableCount} temas)
              </th>
              {resultado.scores.map((s) => (
                <td key={s.candidateId} className="py-3 pl-3 text-right">
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
        {resultado.scores
          .map((s) => `${formatPercent(s.agreement)}% com ${candidates.find((c) => c.id === s.candidateId)!.name}`)
          .join(" e ")}
        . Nessa medida, 100% significa escolher a mesma alternativa do candidato em todos os temas, e cada alternativa de
        distância reduz 33,3 pontos.
      </p>

      <p className="text-xs text-muted">
        Temas sem dados ficam fora do cálculo por falta de posição documentada.{" "}
        <Link href="/metodologia/" className="underline underline-offset-4 hover:text-ink">
          Metodologia completa
        </Link>
      </p>
    </section>
  );
}
