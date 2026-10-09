import { describe, expect, it } from "vitest";
import questionsJson from "@/data/questions.json";
import positionsJson from "@/data/positions.json";
import newsJson from "@/data/news.json";
import { newsFileSchema, positionsFileSchema, questionsFileSchema } from "./schema";

// Validação de integridade dos dados publicados. Roda antes de cada build.

const questions = questionsFileSchema.parse(questionsJson);
const positionsFile = positionsFileSchema.parse(positionsJson);
const news = newsFileSchema.parse(newsJson);

const questionIds = new Set(questions.questions.map((q) => q.id));
const candidateIds = new Set(positionsFile.candidates.map((c) => c.id));

describe("questions.json", () => {
  it("tem ids de pergunta únicos", () => {
    expect(questionIds.size).toBe(questions.questions.length);
  });
});

describe("positions.json", () => {
  it("tem exatamente uma posição por pergunta e candidato", () => {
    for (const qid of questionIds) {
      for (const cid of candidateIds) {
        const matches = positionsFile.positions.filter((p) => p.questionId === qid && p.candidateId === cid);
        expect(matches, `${qid} / ${cid}`).toHaveLength(1);
      }
    }
    expect(positionsFile.positions).toHaveLength(questionIds.size * candidateIds.size);
  });

  it("só referencia perguntas e candidatos existentes", () => {
    for (const p of positionsFile.positions) {
      expect(questionIds.has(p.questionId), p.questionId).toBe(true);
      expect(candidateIds.has(p.candidateId), p.candidateId).toBe(true);
    }
  });

  it("lista candidatos em ordem alfabética (critério neutro de exibição)", () => {
    const names = positionsFile.candidates.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });
});

describe("news.json", () => {
  it("só referencia perguntas e candidatos existentes", () => {
    for (const n of news.items) {
      expect(questionIds.has(n.questionId), n.questionId).toBe(true);
      for (const c of n.candidates) expect(candidateIds.has(c), c).toBe(true);
    }
  });

  it("não repete links", () => {
    const urls = news.items.map((n) => n.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
