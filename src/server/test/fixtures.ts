import { candidates, positions, positionsFile, questions, questionsFile } from "@/lib/data";
import type { ParticipacaoInput } from "@/lib/participacao-schema";
import type { BaseDeCalculo } from "../services/participacoes";

export const base: BaseDeCalculo = {
  questions,
  candidates,
  positions,
  versaoPerguntas: questionsFile.version,
  versaoPosicoes: positionsFile.version,
};

export const CANDIDATOS = candidates.map((c) => c.id) as [string, string];

/** Respostas escolhendo a alternativa de mesmo valor (1 a 4) em todas as perguntas. */
export function respostasComValor(valor: number): Record<string, string> {
  return Object.fromEntries(questions.map((q) => [q.id, q.options.find((o) => o.value === valor)!.id]));
}

export function entrada(perfil: Partial<ParticipacaoInput["perfil"]> = {}, valor = 1): ParticipacaoInput {
  return {
    perfil: { uf: "SP", municipio: 3550308, genero: "mulher", idade: 30, ...perfil },
    respostas: respostasComValor(valor),
    consentimento: true,
    token: "token-de-teste",
    site: "",
  };
}
