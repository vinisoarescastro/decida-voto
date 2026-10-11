import { describe, expect, it } from "vitest";
import type { ThemeResult } from "./affinity";
import type { Position, Question } from "./schema";
import { vereditoDoTema } from "./veredito";

const pergunta = { id: "p", theme: "Tema", text: "Pergunta?", context: "c", options: [] } as unknown as Question;

function posicao(candidateId: string, value: number | null): Position {
  return value === null
    ? { questionId: "p", candidateId, status: "insufficient", value: null, confidence: null, summary: "s", rationale: "", evidence: [] }
    : { questionId: "p", candidateId, status: "documented", value, confidence: "alta", summary: "s", rationale: "r", evidence: [] };
}

function tema(resposta: number, a: number | null, b: number | null): ThemeResult {
  return {
    question: pergunta,
    userValue: resposta,
    userOptionId: "x",
    comparable: a !== null && b !== null,
    closest: null,
    candidates: [
      { candidateId: "a", position: posicao("a", a), affinity: null, share: null },
      { candidateId: "b", position: posicao("b", b), affinity: null, share: null },
    ],
  };
}

describe("vereditoDoTema", () => {
  it("mesma alternativa de um candidato: concorda com ele", () => {
    expect(vereditoDoTema(tema(2, 2, 4))).toEqual({ tipo: "concorda", candidatoId: "a" });
    expect(vereditoDoTema(tema(4, 2, 4))).toEqual({ tipo: "concorda", candidatoId: "b" });
  });

  it("mais perto de um, sem ser igual (mesmo que por um passo): concorda mais com ele", () => {
    expect(vereditoDoTema(tema(3, 1, 4))).toEqual({ tipo: "mais-perto", candidatoId: "b" });
    expect(vereditoDoTema(tema(2, 1, 4))).toEqual({ tipo: "mais-perto", candidatoId: "a" });
  });

  it("mesma alternativa dos dois: concorda com os dois", () => {
    expect(vereditoDoTema(tema(2, 2, 2))).toEqual({ tipo: "os-dois" });
  });

  it("candidatos em alternativas diferentes e mesma distância de cada um: fica entre os dois", () => {
    expect(vereditoDoTema(tema(2, 1, 3))).toEqual({ tipo: "entre" });
    expect(vereditoDoTema(tema(1, 4, 4 - 2))).toEqual({ tipo: "mais-perto", candidatoId: "b" });
  });

  it("os dois na mesma alternativa e a pessoa em outra: diferente dos dois (não 'entre')", () => {
    expect(vereditoDoTema(tema(1, 2, 2))).toEqual({ tipo: "diferente-dos-dois" });
    expect(vereditoDoTema(tema(4, 2, 2))).toEqual({ tipo: "diferente-dos-dois" });
  });

  it("candidato sem posição documentada: sem dados para comparar", () => {
    expect(vereditoDoTema(tema(2, 2, null))).toEqual({ tipo: "sem-dados" });
  });
});
