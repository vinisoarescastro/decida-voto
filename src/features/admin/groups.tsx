import { formatPercent } from "@/lib/affinity";
import type { Agrupamento, Grupo } from "@/server/services/estatisticas";

/** Barra dividida: esquerda na cor do 1º candidato, direita na do 2º (as mesmas do resultado público). */
export function BarraDividida({ esquerda, altura = "h-2" }: { esquerda: number; altura?: string }) {
  return (
    <div aria-hidden="true" className={`flex ${altura} flex-1 gap-0.5 overflow-hidden rounded-full`}>
      <div className="rounded-l-full bg-cand-1" style={{ width: `${esquerda}%` }} />
      <div className="flex-1 rounded-r-full bg-cand-2" />
    </div>
  );
}

function Linha({ g, candidatos }: { g: Grupo; candidatos: [string, string] }) {
  const [a, b] = candidatos;
  return (
    <li className="py-3.5">
      <div className="flex items-baseline justify-between gap-4 text-[15px]">
        <span className="font-medium">{g.rotulo}</span>
        <span className="text-sm tabular-nums text-muted">
          {g.participacoes.toLocaleString("pt-BR")} · {formatPercent(g.proporcao * 100)}%
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs tabular-nums">
        <span className="w-11">{formatPercent(g.pontos[a])}%</span>
        <BarraDividida esquerda={g.pontos[a]} />
        <span className="w-11 text-right">{formatPercent(g.pontos[b])}%</span>
      </div>
    </li>
  );
}

export function Grupos({
  titulo,
  dados,
  candidatos,
  limiteMinimo,
  nota,
}: {
  titulo: string;
  dados: Agrupamento;
  candidatos: [string, string];
  limiteMinimo: number;
  nota?: string;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm">
      <h2 className="font-semibold">{titulo}</h2>
      {nota && <p className="mt-0.5 text-xs text-muted">{nota}</p>}
      {dados.grupos.length > 0 ? (
        <ul className="mt-2 divide-y divide-line">
          {dados.grupos.map((g) => (
            <Linha key={g.chave} g={g} candidatos={candidatos} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Nenhum grupo com participações suficientes.</p>
      )}
      {dados.ocultos > 0 && (
        <p className="mt-2 border-t border-line pt-3 text-xs text-muted">
          {dados.ocultos} {dados.ocultos === 1 ? "grupo oculto" : "grupos ocultos"} por ter menos de {limiteMinimo} participações.
        </p>
      )}
    </section>
  );
}
