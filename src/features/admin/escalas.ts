import { formatPercent } from "@/lib/affinity";

// Escalas de cor do painel (validadas com o validador da skill de visualização: cand-1 × cand-2 passam
// em todas as checagens, inclusive "todos os pares" exigido para mapas, nos temas claro e escuro).
// - Afinidade: DIVERGENTE. Violeta (1º candidato) ↔ cinza neutro (equilibrado) ↔ magenta (2º candidato).
// - Participações: SEQUENCIAL de um só tom neutro (tinta), para não associar volume a nenhum candidato.
// As cores são misturas das variáveis do tema, então funcionam no claro e no escuro sem ajuste.

/** Mesmo limiar do resultado público: diferença menor que 10 pontos (|pontosA − 50| < 5) é "equilibrado". */
export const MEIA_FAIXA_EQUILIBRIO = 5;

/** Intensidades por lado, do mais fraco ao mais forte, com o início de cada classe (distância de 50). */
export const CLASSES_AFINIDADE = [
  { de: MEIA_FAIXA_EQUILIBRIO, mistura: 36 },
  { de: 15, mistura: 60 },
  { de: 30, mistura: 84 },
] as const;

const SEM_DADOS = "var(--surface-2)";
// Ponto médio da escala divergente: cinza visivelmente mais escuro que "sem dados", para não se confundirem.
const NEUTRO = "color-mix(in oklab, var(--muted) 24%, var(--surface))";

/** Cor da afinidade média. `limite` reduz a intensidade máxima quando há texto sobre a cor. */
export function corAfinidade(pontosA: number | null, intensidadeMaxima = 100): string {
  if (pontosA === null) return SEM_DADOS;
  const d = pontosA - 50;
  if (Math.abs(d) < MEIA_FAIXA_EQUILIBRIO) return NEUTRO;
  const classe = [...CLASSES_AFINIDADE].reverse().find((c) => Math.abs(d) >= c.de)!;
  const cor = d > 0 ? "var(--cand-1)" : "var(--cand-2)";
  return `color-mix(in oklab, ${cor} ${Math.min(classe.mistura, intensidadeMaxima)}%, var(--surface))`;
}

/** Degraus da escala de participações (fração do máximo). */
export const DEGRAUS_CONTAGEM = [0.2, 0.4, 0.6, 0.8, 1] as const;

export function corContagem(n: number, maximo: number): string {
  if (n === 0 || maximo === 0) return SEM_DADOS;
  const degrau = DEGRAUS_CONTAGEM.find((d) => n / maximo <= d) ?? 1;
  return `color-mix(in oklab, var(--ink) ${Math.round(18 + degrau * 62)}%, var(--surface))`;
}

/** Texto curto da afinidade para dicas e tabelas: "Flávio Bolsonaro 60% · Lula 40%". */
export function textoAfinidade(pontosA: number | null, nomes: [string, string]): string {
  if (pontosA === null) return "afinidade oculta (poucas participações)";
  return `${nomes[0]} ${formatPercent(pontosA)}% · ${nomes[1]} ${formatPercent(100 - pontosA)}%`;
}

export const plural = (n: number, um: string, varios: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
