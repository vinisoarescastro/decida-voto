import type { Dia } from "@/server/services/analises";

// Séries por dia para os gráficos de linha do painel. O banco só devolve os dias com envio; as linhas
// precisam de todos os dias do período (um dia sem envio é zero, não um buraco).

const UM_DIA = 86_400_000;
const somarDias = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * UM_DIA).toISOString().slice(0, 10);

/** Todos os dias do primeiro ao último envio, com zero participações nos dias sem envio. */
export function preencherDias(dias: Dia[]): Dia[] {
  if (dias.length === 0) return [];
  const porData = new Map(dias.map((d) => [d.dia, d]));
  const saida: Dia[] = [];
  for (let dia = dias[0].dia; dia <= dias[dias.length - 1].dia; dia = somarDias(dia, 1)) {
    saida.push(porData.get(dia) ?? { dia, n: 0, pontosA: null, porOrigem: { convite: 0, panfleto: 0, stories: 0 } });
  }
  return saida;
}

/** Soma acumulada. */
export function acumulado(valores: number[]): number[] {
  let soma = 0;
  return valores.map((v) => (soma += v));
}

/**
 * Média móvel da afinidade (pontos do 1º candidato), ponderada pelas participações de cada dia: cada dia
 * olha para ele e os `janela − 1` anteriores. Dias sem afinidade (sem envio ou ocultos) não entram na conta;
 * null quando a janela inteira está vazia.
 */
export function mediaMovel(dias: Dia[], janela = 7): (number | null)[] {
  return dias.map((_, i) => {
    let pontos = 0;
    let n = 0;
    for (const d of dias.slice(Math.max(0, i - janela + 1), i + 1)) {
      if (d.pontosA === null || d.n === 0) continue;
      pontos += d.pontosA * d.n;
      n += d.n;
    }
    return n === 0 ? null : pontos / n;
  });
}
