import { dataHoraBrasilia } from "@/lib/admin-usuarios";
import { classeBotao } from "@/components/ui/button";
import { classeRotulo, Selecao } from "@/components/ui/field";
import { AbasPainel } from "@/features/admin/abas";
import { CabecalhoPainel } from "@/features/admin/cabecalho";
import { exigirAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import { ACOES, listarAuditoria, type Acao } from "@/server/services/auditoria";
import { listarUsuarios } from "@/server/services/usuarios";

const LIMITE = 300;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PaginaAuditoria({ searchParams }: PageProps<"/admin/auditoria">) {
  const usuario = await exigirAdmin({ tela: "Auditoria" });
  const { pessoa } = await searchParams;
  const filtro = typeof pessoa === "string" && UUID.test(pessoa) ? pessoa : undefined;
  const [registros, usuarios] = await Promise.all([listarAuditoria(db(), { limite: LIMITE, usuarioId: filtro }), listarUsuarios(db())]);

  return (
    <div className="animate-surgir space-y-6 sm:space-y-8">
      <CabecalhoPainel usuario={usuario} titulo="Auditoria" descricao="Entradas no painel, telas visualizadas e alterações feitas, com data e hora (Brasília)." />
      <AbasPainel atual="auditoria" />

      <section aria-labelledby="auditoria-titulo" className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="auditoria-titulo" className="font-semibold">
              Registros
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Os {LIMITE} mais recentes. Visualizações repetidas da mesma tela em até 10 minutos contam uma vez. Não registramos senhas nem IP.
            </p>
          </div>
          <form className="flex items-end gap-2" action="/admin/auditoria/">
            <div>
              <label htmlFor="pessoa" className={classeRotulo}>
                Pessoa
              </label>
              <Selecao id="pessoa" name="pessoa" defaultValue={filtro ?? ""} className="mt-2 w-56">
                <option value="">Todas</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.usuario})
                  </option>
                ))}
              </Selecao>
            </div>
            <button type="submit" className={classeBotao("secundario", "md")}>
              Filtrar
            </button>
          </form>
        </div>

        {registros.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Nenhum registro.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Data e hora</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Usuário</th>
                  <th scope="col" className="py-2 font-medium">O que fez</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-b border-line align-top last:border-0">
                    <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-muted">{dataHoraBrasilia(r.quando)}</td>
                    <td className="py-2.5 pr-4 font-medium">{r.usuario}</td>
                    <td className="py-2.5">
                      {ACOES[r.acao as Acao] ?? r.acao}
                      {r.detalhe && <span className="text-muted"> · {r.detalhe}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
