import type { Answers } from "@/lib/affinity";
import type { Question } from "@/lib/schema";

// Modelo de navegação do questionário. Cada passo vira uma entrada no histórico do navegador
// (?passo=1 … ?passo=10, ?passo=resultado), para que o gesto/botão "voltar" do celular
// retorne à pergunta anterior em vez de sair da página e perder as respostas.

export type Passo = { tipo: "perfil" } | { tipo: "pergunta"; indice: number } | { tipo: "resultado" };

export function passoParaUrl(passo: Passo): string | null {
  if (passo.tipo === "perfil") return null;
  if (passo.tipo === "resultado") return "resultado";
  return String(passo.indice + 1);
}

/** Posição numérica do passo, usada para saber se a navegação foi para frente ou para trás. */
export function ordemDoPasso(passo: Passo): number {
  if (passo.tipo === "perfil") return 0;
  if (passo.tipo === "resultado") return 1000;
  return passo.indice + 1;
}

/**
 * Converte o valor da URL no passo realmente permitido: sem token só existe o perfil, e não é
 * possível pular para perguntas além da primeira sem resposta (nem para o resultado com respostas faltando).
 */
export function resolverPasso(valorUrl: string | null, temToken: boolean, perguntas: Question[], respostas: Answers): Passo {
  if (!temToken) return { tipo: "perfil" };
  const primeiraSemResposta = perguntas.findIndex((q) => !respostas[q.id]);
  const ultimaPermitida = primeiraSemResposta === -1 ? perguntas.length - 1 : primeiraSemResposta;

  if (valorUrl === "resultado") {
    return primeiraSemResposta === -1 ? { tipo: "resultado" } : { tipo: "pergunta", indice: primeiraSemResposta };
  }
  const numero = Number(valorUrl);
  if (valorUrl !== null && Number.isInteger(numero) && numero >= 1 && numero <= perguntas.length) {
    return { tipo: "pergunta", indice: Math.min(numero - 1, ultimaPermitida) };
  }
  return { tipo: "perfil" };
}
