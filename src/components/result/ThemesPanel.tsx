import type { AffinityResult, ThemeResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { ThemeDetail } from "./ThemeDetail";

/** Divergência = distância de 2 ou 3 pontos na escala (afinidade ≤ 33,3%). */
const DIVERGENCE_MAX_AFFINITY = 1 / 3 + 1e-9;
const CORES = ["bg-cand-1", "bg-cand-2"] as const;

export function ThemesPanel({ result }: { result: AffinityResult }) {
  const rows: { label: string; cor?: string; themes: ThemeResult[] }[] = [
    ...candidates.map((c, i) => ({
      label: `Mais próximo de ${c.name}`,
      cor: CORES[i],
      themes: result.themes.filter((t) => t.closest === c.id),
    })),
    { label: "Mesma distância", themes: result.themes.filter((t) => t.closest === "empate") },
    ...candidates.map((c, i) => ({
      label: `Maior divergência com ${c.name}`,
      cor: CORES[i],
      themes: result.themes.filter((t) => {
        const a = t.candidates.find((x) => x.candidateId === c.id)?.affinity;
        return t.comparable && a != null && a <= DIVERGENCE_MAX_AFFINITY;
      }),
    })),
    { label: "Sem dados suficientes (fora do cálculo)", themes: result.themes.filter((t) => !t.comparable) },
  ].filter((r) => r.themes.length > 0);

  return (
    <div className="space-y-10">
      <dl className="divide-y divide-line rounded-2xl border border-line bg-surface/80">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[13rem_1fr] sm:gap-4">
            <dt className="flex items-center gap-2 text-sm text-muted">
              {row.cor && <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${row.cor}`} />}
              {row.label}
            </dt>
            <dd className="flex flex-wrap content-start items-start gap-1.5">
              {row.themes.map((t) => (
                <span key={t.question.id} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium">
                  {t.question.theme}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <h2 className="text-sm font-semibold">Comparação tema a tema</h2>
        <p className="mt-1 text-sm text-muted">Abra um tema para ver sua resposta, a posição de cada candidato e as fontes.</p>
        <div className="mt-3 divide-y divide-line border-y border-line">
          {result.themes.map((theme) => (
            <ThemeDetail key={theme.question.id} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  );
}
