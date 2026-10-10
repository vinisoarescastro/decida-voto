import { candidates, positionsFile, questions, questionsFile } from "@/lib/data";
import { aplicarRascunhos, camposAlterados, hojeEmBrasilia, rascunhoDoPublicado, referenciaDe, validarArquivos } from "@/lib/revisao";
import { classeBotao } from "@/components/ui/button";
import { Alerta } from "@/components/ui/field";
import { IconeInfo } from "@/components/ui/icon";
import { Sobretitulo } from "@/components/ui/text";
import { AbasPainel } from "@/features/admin/abas";
import { BotaoSair } from "@/features/admin/logout-button";
import { RevisaoPergunta } from "@/features/admin/revisao-form";
import { ListaFontes } from "@/features/result/evidence-list";
import { exigirAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import { lerRascunhos } from "@/server/services/revisao";

export default async function PaginaRevisao() {
  await exigirAdmin();
  const base = { questions: questionsFile, positions: positionsFile };
  const registros = await lerRascunhos(db());
  const rascunhos = Object.fromEntries(Object.entries(registros).map(([id, r]) => [id, r.rascunho]));
  const saida = aplicarRascunhos(base, rascunhos, hojeEmBrasilia());
  const problemas = validarArquivos(saida);

  const revisadas = questions.filter((q) => rascunhos[q.id]?.revisada).length;
  const comAlteracoes = questions.filter((q) => rascunhos[q.id] && camposAlterados(rascunhoDoPublicado(referenciaDe(base, q.id)!), rascunhos[q.id]).size > 0).length;
  const novaVersao = saida.questions.version !== questionsFile.version || saida.positions.version !== positionsFile.version;

  return (
    <div className="animate-surgir space-y-6 sm:space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Sobretitulo>Área administrativa</Sobretitulo>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-3xl">Revisão de conteúdo</h1>
          <p className="mt-1 text-sm text-muted">Perguntas, alternativas e a posição atribuída a cada candidato.</p>
        </div>
        <BotaoSair />
      </header>

      <AbasPainel atual="revisao" />

      <div role="note" className="flex items-start gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-xs leading-relaxed text-muted">
        <IconeInfo className="mt-0.5 shrink-0 text-ink" />
        <div>
          <strong className="text-ink">Como funciona.</strong> As edições ficam salvas aqui como rascunho e{" "}
          <strong className="text-ink">não mudam o site</strong>. Para publicar: (1) revise cada pergunta e marque como
          revisada; (2) baixe os arquivos no fim da página; (3) a equipe técnica substitui os arquivos em src/data, roda os
          testes e publica. As fontes de cada posição são cadastradas pela equipe técnica, direto em positions.json.
        </div>
      </div>

      <section aria-label="Andamento" className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm">
          <p className="text-xs font-medium text-muted">Revisadas</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {revisadas}
            <span className="text-lg text-muted"> de {questions.length}</span>
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm">
          <p className="text-xs font-medium text-muted">Com alterações</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{comAlteracoes}</p>
        </div>
      </section>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const ref = referenciaDe(base, q.id)!;
          const registro = registros[q.id];
          const desatualizado = Boolean(registro) && (registro.versaoPerguntas !== questionsFile.version || registro.versaoPosicoes !== positionsFile.version);
          return (
            <RevisaoPergunta
              key={q.id}
              numero={i + 1}
              referencia={ref}
              candidatos={candidates}
              inicial={registro?.rascunho ?? null}
              desatualizado={desatualizado}
              fontes={Object.fromEntries(candidates.map((c) => [c.id, <ListaFontes key={c.id} fontes={ref.posicoes[c.id].evidence} />]))}
            />
          );
        })}
      </div>

      <section aria-labelledby="exportar-titulo" className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
        <h2 id="exportar-titulo" className="font-semibold">
          Exportar para publicação
        </h2>
        <p className="mt-1 text-sm text-muted">
          Arquivos com os rascunhos aplicados, no mesmo formato do repositório.{" "}
          {novaVersao
            ? `Como o conteúdo mudou, as versões sobem para ${saida.questions.version} (perguntas) e ${saida.positions.version} (posições).`
            : "Sem alterações de conteúdo: as versões continuam as mesmas."}{" "}
          {revisadas === questions.length
            ? "Todas as perguntas estão revisadas: positions.json sai como “revisado”."
            : "Enquanto houver pergunta pendente, positions.json sai como “pendente”."}
        </p>

        {problemas.length > 0 ? (
          <div className="mt-4">
            <Alerta>Os arquivos ainda não passam na validação usada antes do build. Corrija antes de exportar:</Alerta>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {problemas.slice(0, 20).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a href="/api/admin/revisao/exportar/?arquivo=perguntas" download="questions.json" className={classeBotao("secundario", "sm")}>
              Baixar questions.json
            </a>
            <a href="/api/admin/revisao/exportar/?arquivo=posicoes" download="positions.json" className={classeBotao("secundario", "sm")}>
              Baixar positions.json
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
