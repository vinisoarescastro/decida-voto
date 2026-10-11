import type { ThemeResult } from "./affinity";

// Veredito de cada pergunta para a visão "Pergunta a pergunta" do resultado: diz só com quem a pessoa
// concorda mais, sem porcentagem. Usa a mesma distância na escala (1 a 4) do cálculo de afinidade.

export type Veredito =
  /** Marcou a mesma alternativa do candidato (e não a do outro). */
  | { tipo: "concorda"; candidatoId: string }
  /** Não marcou a mesma alternativa, mas ficou mais perto deste candidato (mesmo que por pouco). */
  | { tipo: "mais-perto"; candidatoId: string }
  /** Marcou a mesma alternativa dos dois candidatos. */
  | { tipo: "os-dois" }
  /** Os dois candidatos estão na mesma alternativa, e a pessoa marcou outra. */
  | { tipo: "diferente-dos-dois" }
  /** Os candidatos estão em alternativas diferentes e a pessoa ficou à mesma distância de cada um. */
  | { tipo: "entre" }
  /** Algum candidato não tem posição documentada neste tema. */
  | { tipo: "sem-dados" };

export function vereditoDoTema(tema: ThemeResult): Veredito {
  const distancias: { id: string; valor: number; d: number }[] = [];
  for (const c of tema.candidates) {
    if (c.position?.status !== "documented") return { tipo: "sem-dados" };
    distancias.push({ id: c.candidateId, valor: c.position.value, d: Math.abs(tema.userValue - c.position.value) });
  }
  if (distancias.length < 2) return { tipo: "sem-dados" };
  const [a, b] = distancias;
  if (a.valor === b.valor) return a.d === 0 ? { tipo: "os-dois" } : { tipo: "diferente-dos-dois" };
  if (a.d === b.d) return { tipo: "entre" };
  const perto = a.d < b.d ? a : b;
  return perto.d === 0 ? { tipo: "concorda", candidatoId: perto.id } : { tipo: "mais-perto", candidatoId: perto.id };
}
