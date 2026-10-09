import { describe, expect, it } from "vitest";
import { computeAffinity, displayShares, formatPercent, themeAffinity, themeShares, type Answers } from "./affinity";
import type { Candidate, Position, Question } from "./schema";

const candidates: Candidate[] = [
  { id: "a", name: "A", fullName: "Candidato A", party: "X" },
  { id: "b", name: "B", fullName: "Candidato B", party: "Y" },
];

function question(id: string): Question {
  return {
    id,
    theme: id,
    text: id,
    context: id,
    options: [
      { id: "a", value: 1, text: "1" },
      { id: "b", value: 2, text: "2" },
      { id: "c", value: 3, text: "3" },
      { id: "d", value: 4, text: "4" },
    ],
  };
}

const evidence = [
  { title: "t", publisher: "p", url: "https://exemplo.invalid", publishedAt: null, type: "noticia" as const, excerpt: "e" },
];

function documented(questionId: string, candidateId: string, value: number): Position {
  return { questionId, candidateId, status: "documented", value, confidence: "alta", summary: "s", rationale: "r", evidence };
}

function insufficient(questionId: string, candidateId: string): Position {
  return { questionId, candidateId, status: "insufficient", value: null, confidence: null, summary: "s", rationale: "", evidence: [] };
}

describe("themeAffinity", () => {
  it("retorna 1, 2/3, 1/3 e 0 conforme a distância", () => {
    expect(themeAffinity(1, 1)).toBe(1);
    expect(themeAffinity(1, 2)).toBeCloseTo(2 / 3);
    expect(themeAffinity(4, 2)).toBeCloseTo(1 / 3);
    expect(themeAffinity(1, 4)).toBe(0);
  });
});

describe("formatPercent", () => {
  it("mostra o valor com até uma casa decimal, sem arredondar por faixas", () => {
    expect(formatPercent(66.6667)).toBe("66,7");
    expect(formatPercent(74.074)).toBe("74,1");
    expect(formatPercent(0)).toBe("0");
    expect(formatPercent(100)).toBe("100");
  });
});

describe("themeShares", () => {
  it("divide os pontos pela distância do outro candidato", () => {
    // resposta 1, candidatos em 1 e 3 → quem coincide leva tudo
    expect(themeShares(1, 1, 3)).toEqual([1, 0]);
    // resposta 2, candidatos em 1 e 3 → mesma distância
    expect(themeShares(2, 1, 3)).toEqual([0.5, 0.5]);
    // resposta 4, candidatos em 1 e 3 → distâncias 3 e 1
    expect(themeShares(4, 1, 3)).toEqual([0.25, 0.75]);
  });

  it("dá 50 × 50 quando os candidatos têm a mesma posição", () => {
    expect(themeShares(2, 2, 2)).toEqual([0.5, 0.5]);
    expect(themeShares(4, 2, 2)).toEqual([0.5, 0.5]);
  });

  it("sempre soma 1", () => {
    for (let u = 1; u <= 4; u++)
      for (let a = 1; a <= 4; a++)
        for (let b = 1; b <= 4; b++) {
          const [x, y] = themeShares(u, a, b);
          expect(x + y).toBeCloseTo(1);
        }
  });
});

describe("displayShares", () => {
  it("garante que a soma exibida seja exatamente 100", () => {
    expect(displayShares(50.05)).toEqual([50.1, 49.9]);
    expect(displayShares(66.6667)).toEqual([66.7, 33.3]);
    expect(displayShares(100)).toEqual([100, 0]);
  });
});

describe("computeAffinity", () => {
  const qs = [question("q1"), question("q2"), question("q3")];

  it("calcula a média dos pontos por tema e soma 100%", () => {
    const positions = [
      documented("q1", "a", 1), documented("q1", "b", 3), // resposta 1 → 100 × 0
      documented("q2", "a", 1), documented("q2", "b", 3), // resposta 2 → 50 × 50
      documented("q3", "a", 1), documented("q3", "b", 3), // resposta 4 → 25 × 75
    ];
    const answers: Answers = { q1: "a", q2: "b", q3: "d" };
    const r = computeAffinity(qs, candidates, positions, answers);
    // A: (100 + 50 + 25) / 3 = 58,33 | B: (0 + 50 + 75) / 3 = 41,67
    expect(r.scores[0].share).toBeCloseTo(58.333, 2);
    expect(r.scores[1].share).toBeCloseTo(41.667, 2);
    expect(r.scores[0].share + r.scores[1].share).toBeCloseTo(100);
    expect(r.scores[0].display + r.scores[1].display).toBe(100);
    expect(r.themes.map((t) => t.closest)).toEqual(["a", "empate", "b"]);
    expect(r.similar).toBe(false);
  });

  it("mantém a concordância absoluta para os detalhes", () => {
    const positions = [documented("q1", "a", 1), documented("q1", "b", 2)];
    const r = computeAffinity([qs[0]], candidates, positions, { q1: "d" });
    // resposta 4: distâncias 3 e 2 → concordância 0% e 33,3%; pontos 40 × 60
    expect(r.scores[0].agreement).toBeCloseTo(0);
    expect(r.scores[1].agreement).toBeCloseTo(33.333, 2);
    expect(r.scores[0].share).toBeCloseTo(40);
    expect(r.scores[1].share).toBeCloseTo(60);
  });

  it("exclui temas em que algum candidato não tem posição documentada", () => {
    const positions = [
      documented("q1", "a", 2), documented("q1", "b", 2),
      documented("q2", "a", 1), insufficient("q2", "b"),
      documented("q3", "a", 1), // q3 sem registro para "b"
    ];
    const r = computeAffinity(qs, candidates, positions, { q1: "b", q2: "a", q3: "a" });
    expect(r.comparableCount).toBe(1);
    expect(r.themes[1].comparable).toBe(false);
    expect(r.themes[1].candidates[0].share).toBeNull();
    expect(r.themes[2].comparable).toBe(false);
    expect(r.scores.map((s) => s.share)).toEqual([50, 50]);
    expect(r.themes[0].closest).toBe("empate");
    expect(r.similar).toBe(true);
  });

  it("trata o resultado como equilibrado quando a diferença é menor que 10 pontos", () => {
    const positions = [documented("q1", "a", 1), documented("q1", "b", 4)];
    // resposta 3: distâncias 2 e 1 → 33,3 × 66,7 (não equilibrado)
    expect(computeAffinity([qs[0]], candidates, positions, { q1: "c" }).similar).toBe(false);
    const p2 = [documented("q1", "a", 1), documented("q1", "b", 3), documented("q2", "a", 1), documented("q2", "b", 3)];
    // 50 × 50 e 50 × 50 → equilibrado
    expect(computeAffinity(qs.slice(0, 2), candidates, p2, { q1: "b", q2: "b" }).similar).toBe(true);
  });

  it("retorna zero e não equilibrado quando nenhum tema é comparável", () => {
    const answers: Answers = Object.fromEntries(qs.map((q) => [q.id, "a"]));
    const r = computeAffinity(qs, candidates, [], answers);
    expect(r.comparableCount).toBe(0);
    expect(r.scores.map((s) => s.display)).toEqual([0, 0]);
    expect(r.similar).toBe(false);
  });

  it("é determinístico para as mesmas entradas", () => {
    const positions = qs.flatMap((q) => [documented(q.id, "a", 2), documented(q.id, "b", 3)]);
    const answers: Answers = Object.fromEntries(qs.map((q) => [q.id, "d"]));
    expect(computeAffinity(qs, candidates, positions, answers)).toEqual(computeAffinity(qs, candidates, positions, answers));
  });

  it("falha ao receber resposta ausente ou inválida", () => {
    expect(() => computeAffinity(qs, candidates, [], {})).toThrow(/sem resposta/);
    expect(() => computeAffinity([qs[0]], candidates, [], { q1: "z" })).toThrow(/inválida/);
  });
});
