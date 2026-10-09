import type { AffinityResult, ThemeResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import { ThemeDetail } from "./ThemeDetail";

/** Divergência = distância de 2 ou 3 pontos na escala (afinidade ≤ 33,3%). */
const DIVERGENCE_MAX_AFFINITY = 1 / 3 + 1e-9;

const themeNames = (themes: ThemeResult[]) => themes.map((t) => t.question.theme).join(", ");

export function ThemesPanel({ result }: { result: AffinityResult }) {
  const rows: { label: string; themes: ThemeResult[] }[] = [
    ...candidates.map((c) => ({
      label: `Mais próximo de ${c.name}`,
      themes: result.themes.filter((t) => t.closest === c.id),
    })),
    { label: "Mesma distância", themes: result.themes.filter((t) => t.closest === "empate") },
    ...candidates.map((c) => ({
      label: `Maior divergência com ${c.name}`,
      themes: result.themes.filter((t) => {
        const a = t.candidates.find((x) => x.candidateId === c.id)?.affinity;
        return t.comparable && a != null && a <= DIVERGENCE_MAX_AFFINITY;
      }),
    })),
    { label: "Sem dados suficientes (fora do cálculo)", themes: result.themes.filter((t) => !t.comparable) },
  ].filter((r) => r.themes.length > 0);

  return (
    <div className="space-y-12">
      <dl className="space-y-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 sm:grid-cols-[14rem_1fr] sm:gap-4">
            <dt className="text-muted">{row.label}</dt>
            <dd>{themeNames(row.themes)}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-sm text-muted">Abra um tema para ver sua resposta, a posição de cada candidato e as fontes.</p>
        <div className="divide-y divide-line border-y border-line">
          {result.themes.map((theme) => (
            <ThemeDetail key={theme.question.id} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  );
}
