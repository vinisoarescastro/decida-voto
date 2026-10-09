import { formatPercent } from "@/lib/affinity";
import type { Agrupamento, Grupo } from "@/server/services/estatisticas";

type Props = { titulo: string; dados: Agrupamento; candidatos: [string, string]; limiteMinimo: number; nota?: string };

/** Barra dividida compacta: lado esquerdo = 1º candidato (cor cheia), direito = 2º (cor suave). */
export function BarraDividida({ esquerda, altura = "h-1.5" }: { esquerda: number; altura?: string }) {
  return (
    <div aria-hidden="true" className={`flex ${altura} flex-1 gap-[2px] overflow-hidden rounded-full`}>
      <div className="rounded-l-full bg-bar" style={{ width: `${esquerda}%` }} />
      <div className="flex-1 rounded-r-full bg-bar/35" />
    </div>
  );
}

function Linha({ g, candidatos }: { g: Grupo; candidatos: [string, string] }) {
  const [a, b] = candidatos;
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span>{g.rotulo}</span>
        <span className="tabular-nums text-muted">
          {g.participacoes.toLocaleString("pt-BR")} · {formatPercent(g.proporcao * 100)}%
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs tabular-nums">
        <span className="w-12">{formatPercent(g.pontos[a])}%</span>
        <BarraDividida esquerda={g.pontos[a]} />
        <span className="w-12 text-right">{formatPercent(g.pontos[b])}%</span>
      </div>
    </li>
  );
}

export function Grupos({ titulo, dados, candidatos, limiteMinimo, nota }: Props) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      {nota && <p className="text-xs text-muted">{nota}</p>}
      {dados.grupos.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line">
          {dados.grupos.map((g) => (
            <Linha key={g.chave} g={g} candidatos={candidatos} />
          ))}
        </ul>
      ) : (
        <p className="border-y border-line py-4 text-sm text-muted">Nenhum grupo com participações suficientes.</p>
      )}
      {dados.ocultos > 0 && (
        <p className="text-xs text-muted">
          {dados.ocultos} {dados.ocultos === 1 ? "grupo oculto" : "grupos ocultos"} por ter menos de {limiteMinimo} participações.
        </p>
      )}
    </section>
  );
}
