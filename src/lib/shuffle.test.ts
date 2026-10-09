import { describe, expect, it } from "vitest";
import { shuffle, shuffleOptions } from "./shuffle";
import questionsJson from "@/data/questions.json";
import type { QuestionsFile } from "./schema";

const { questions } = questionsJson as QuestionsFile;

describe("shuffle", () => {
  it("mantém os mesmos elementos e não altera o original", () => {
    const original = [1, 2, 3, 4];
    const result = shuffle(original);
    expect([...result].sort()).toEqual([1, 2, 3, 4]);
    expect(original).toEqual([1, 2, 3, 4]);
  });

  it("produz as 24 ordens possíveis de 4 alternativas", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(shuffle(["a", "b", "c", "d"]).join(""));
    expect(seen.size).toBe(24);
  });

  it("é reproduzível com a mesma fonte de aleatoriedade", () => {
    const seq = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    expect(shuffle([1, 2, 3, 4, 5], seq(42))).toEqual(shuffle([1, 2, 3, 4, 5], seq(42)));
  });
});

describe("shuffleOptions", () => {
  it("sorteia todas as perguntas preservando as alternativas", () => {
    const order = shuffleOptions(questions);
    for (const q of questions) {
      expect(order[q.id].map((o) => o.id).sort()).toEqual(q.options.map((o) => o.id).sort());
    }
  });
});
