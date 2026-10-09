import type { Candidate, Position, Question } from "./schema";

// Metodologia (documentada também em /metodologia):
// 1. Cada alternativa tem um valor de 1 a 4 num eixo ordinal.
// 2. Só entram no cálculo os temas em que AMBOS os candidatos têm posição documentada.
// 3. Em cada tema, 100 pontos são divididos entre os dois candidatos: cada um recebe a distância
//    do OUTRO até a resposta, dividida pela soma das duas distâncias. Quem está mais perto leva mais.
//    Se as duas distâncias forem iguais (inclusive zero), o tema fica 50 × 50.
// 4. O resultado é a média simples desses pontos (todos os temas têm o mesmo peso) e soma 100%.
// 5. A concordância absoluta (1 − distância ÷ 3) também é calculada e exibida nos detalhes,
//    para não esconder casos em que a pessoa discorda dos dois.

export const MAX_DISTANCE = 3;
/** Diferença (em pontos percentuais) abaixo da qual o resultado é tratado como equilibrado (ex.: 45 × 55). */
export const SIMILARITY_THRESHOLD = 10;

/** Alternativa escolhida (id) por pergunta (id). */
export type Answers = Record<string, string>;

export type CandidateThemeResult = {
  candidateId: string;
  position: Position | undefined;
  /** Concordância absoluta no tema (0..1), ou null quando não há posição documentada. */
  affinity: number | null;
  /** Parte dos 100 pontos do tema (0..1), ou null quando o tema não é comparável. */
  share: number | null;
};

export type ThemeResult = {
  question: Question;
  userValue: number;
  userOptionId: string;
  /** true quando os dois candidatos têm posição documentada neste tema. */
  comparable: boolean;
  candidates: CandidateThemeResult[];
  /** id do candidato mais próximo, "empate" ou null se o tema não é comparável. */
  closest: string | "empate" | null;
};

export type CandidateScore = {
  candidateId: string;
  /** Resultado principal: parte dos 100% (0..100). A soma dos candidatos é 100. */
  share: number;
  /** Valor exibido, com uma casa decimal, ajustado para que a soma exibida seja exatamente 100. */
  display: number;
  /** Concordância absoluta média (0..100), independente do outro candidato. */
  agreement: number;
};

export type AffinityResult = {
  themes: ThemeResult[];
  scores: CandidateScore[];
  comparableCount: number;
  /** true quando a diferença entre os dois resultados é menor que SIMILARITY_THRESHOLD. */
  similar: boolean;
};

export function themeAffinity(userValue: number, candidateValue: number): number {
  return 1 - Math.abs(userValue - candidateValue) / MAX_DISTANCE;
}

/**
 * Divide 1 ponto entre dois candidatos num tema: cada um recebe a distância do outro ÷ soma das distâncias.
 * Distâncias iguais (inclusive ambas zero) resultam em 0,5 para cada.
 */
export function themeShares(userValue: number, valueA: number, valueB: number): [number, number] {
  const dA = Math.abs(userValue - valueA);
  const dB = Math.abs(userValue - valueB);
  if (dA + dB === 0) return [0.5, 0.5];
  return [dB / (dA + dB), dA / (dA + dB)];
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Arredonda o primeiro valor a uma casa decimal e deriva o segundo de 100, para a soma exibida ser 100. */
export function displayShares(shareA: number): [number, number] {
  const a = round1(shareA);
  return [a, round1(100 - a)];
}

/** Formata um percentual (0..100) com até uma casa decimal, no padrão brasileiro: 66,7 · 100 · 0. */
export function formatPercent(percent: number): string {
  return percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export function findPosition(positions: Position[], questionId: string, candidateId: string): Position | undefined {
  return positions.find((p) => p.questionId === questionId && p.candidateId === candidateId);
}

export function computeAffinity(
  questions: Question[],
  candidates: Candidate[],
  positions: Position[],
  answers: Answers,
): AffinityResult {
  if (candidates.length !== 2) throw new Error("O cálculo de divisão de pontos exige exatamente 2 candidatos.");

  const themes: ThemeResult[] = questions.map((question) => {
    const optionId = answers[question.id];
    if (!optionId) throw new Error(`Pergunta sem resposta: ${question.id}`);
    const option = question.options.find((o) => o.id === optionId);
    if (!option) throw new Error(`Alternativa inválida para ${question.id}: ${optionId}`);

    const perCandidate = candidates.map<CandidateThemeResult>((c) => {
      const position = findPosition(positions, question.id, c.id);
      const affinity = position?.status === "documented" ? themeAffinity(option.value, position.value) : null;
      return { candidateId: c.id, position, affinity, share: null };
    });

    const [a, b] = perCandidate;
    const comparable = a.position?.status === "documented" && b.position?.status === "documented";
    let closest: ThemeResult["closest"] = null;
    if (a.position?.status === "documented" && b.position?.status === "documented") {
      [a.share, b.share] = themeShares(option.value, a.position.value, b.position.value);
      closest = a.share === b.share ? "empate" : a.share > b.share ? a.candidateId : b.candidateId;
    }

    return { question, userValue: option.value, userOptionId: option.id, comparable, candidates: perCandidate, closest };
  });

  const comparableThemes = themes.filter((t) => t.comparable);
  const comparableCount = comparableThemes.length;
  const mean = (pick: (c: CandidateThemeResult) => number, candidateId: string) =>
    comparableCount === 0
      ? 0
      : (comparableThemes.reduce((acc, t) => acc + pick(t.candidates.find((x) => x.candidateId === candidateId)!), 0) /
          comparableCount) *
        100;

  const shares = candidates.map((c) => mean((x) => x.share!, c.id));
  const displays = displayShares(shares[0]);
  const scores: CandidateScore[] = candidates.map((c, i) => ({
    candidateId: c.id,
    share: shares[i],
    display: comparableCount === 0 ? 0 : displays[i],
    agreement: mean((x) => x.affinity!, c.id),
  }));

  const similar = comparableCount > 0 && Math.abs(shares[0] - shares[1]) < SIMILARITY_THRESHOLD;

  return { themes, scores, comparableCount, similar };
}
