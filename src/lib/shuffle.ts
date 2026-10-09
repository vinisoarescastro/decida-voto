import type { Option, Question } from "./schema";

/** Embaralhamento de Fisher–Yates: todas as ordens têm a mesma probabilidade. Não altera o array original. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Sorteia a ordem das alternativas de cada pergunta.
 * Evita que a mesma posição na tela (primeira, última) fique sempre associada ao mesmo lado da escala.
 */
export function shuffleOptions(questions: readonly Question[], random?: () => number): Record<string, Option[]> {
  return Object.fromEntries(questions.map((q) => [q.id, shuffle(q.options, random)]));
}
