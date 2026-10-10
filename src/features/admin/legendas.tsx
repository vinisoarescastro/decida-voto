import { corAfinidade, corContagem, DEGRAUS_CONTAGEM } from "./escalas";

const Amostra = ({ cor }: { cor: string }) => <span aria-hidden="true" className="h-3 flex-1 first:rounded-l-full last:rounded-r-full" style={{ background: cor }} />;

/** Legenda divergente: à esquerda o 1º candidato (como nos demais gráficos), ao centro o equilíbrio. */
export function LegendaAfinidade({ nomes, intensidadeMaxima }: { nomes: [string, string]; intensidadeMaxima?: number }) {
  const pontos = [85, 70, 60, 50, 40, 30, 15];
  return (
    <div className="text-xs text-muted">
      <div className="flex gap-0.5">
        {pontos.map((p) => (
          <Amostra key={p} cor={corAfinidade(p, intensidadeMaxima)} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between gap-2">
        <span>Mais {nomes[0]}</span>
        <span>Equilibrado</span>
        <span className="text-right">Mais {nomes[1]}</span>
      </div>
      <p className="mt-2 flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ background: corAfinidade(null) }} />
        Sem participações
      </p>
    </div>
  );
}

/** Legenda sequencial de participações: um único tom, do claro (poucas) ao escuro (muitas). */
export function LegendaContagem({ maximo }: { maximo: number }) {
  return (
    <div className="text-xs text-muted">
      <div className="flex gap-0.5">
        <Amostra cor={corContagem(0, maximo)} />
        {DEGRAUS_CONTAGEM.map((d) => (
          <Amostra key={d} cor={corContagem(Math.max(1, Math.ceil(d * maximo)), maximo)} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        <span>Nenhuma</span>
        <span>{maximo.toLocaleString("pt-BR")} participações</span>
      </div>
    </div>
  );
}
