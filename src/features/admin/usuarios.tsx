"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Botao } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialog";
import { Alerta, Campo, ErroCampo, classeRotulo } from "@/components/ui/field";
import { Girando, IconeCheck } from "@/components/ui/icon";
import {
  dataHoraBrasilia,
  edicaoUsuarioSchema,
  errosPorCampo,
  novoUsuarioSchema,
  PAPEIS,
  ROTULO_SITUACAO,
  rotuloPapel,
  situacaoDe,
  type Papel,
} from "@/lib/admin-usuarios";
import type { UsuarioLista } from "@/server/services/usuarios";

// Gestão de usuários do painel. O master cria, edita, reseta senha e exclui; o admin só vê a lista.
// Toda regra é conferida de novo no servidor (papel, último master, a própria conta).

type Modo =
  | { tipo: "novo" }
  | { tipo: "editar"; u: UsuarioLista }
  | { tipo: "resetar"; u: UsuarioLista }
  | { tipo: "excluir"; u: UsuarioLista }
  | { tipo: "senha"; nome: string; usuario: string; senha: string; novo: boolean };

async function chamar(url: string, metodo: string, corpo?: unknown) {
  const r = await fetch(url, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { r, corpo: await r.json().catch(() => ({})) };
}

export function GestaoUsuarios({ usuarios, atualId, podeEditar }: { usuarios: UsuarioLista[]; atualId: string; podeEditar: boolean }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo | null>(null);
  const fechar = () => setModo(null);
  const concluir = (proximo: Modo | null = null) => {
    setModo(proximo);
    router.refresh();
  };

  const titulo: Record<Modo["tipo"], string> = {
    novo: "Adicionar usuário",
    editar: "Editar usuário",
    resetar: "Resetar senha",
    excluir: "Excluir usuário",
    senha: "Senha provisória",
  };

  return (
    <section aria-labelledby="usuarios-titulo" className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="usuarios-titulo" className="font-semibold">
            Pessoas com acesso
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Master vê e altera tudo, inclusive os usuários. Admin só visualiza. Último acesso no horário de Brasília.
          </p>
        </div>
        {podeEditar && (
          <Botao tamanho="sm" onClick={() => setModo({ tipo: "novo" })} className="shrink-0">
            Adicionar usuário
          </Botao>
        )}
      </div>

      {/* "relative": o rótulo sr-only (absoluto) da coluna de ações não escapa da rolagem e não alarga a página. */}
      <div className="relative mt-5 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Pessoa</th>
              <th scope="col" className="py-2 pr-4 font-medium">Nível</th>
              <th scope="col" className="py-2 pr-4 font-medium">Situação</th>
              <th scope="col" className="py-2 pr-4 font-medium">Último acesso</th>
              {podeEditar && (
                <th scope="col" className="py-2 text-right font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const situacao = situacaoDe(u);
              const voce = u.id === atualId;
              return (
                <tr key={u.id} className="border-b border-line align-top last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">
                      {u.nome}
                      {voce && <span className="ml-2 text-xs font-normal text-muted">(você)</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {u.usuario}
                      {u.email && <> · {u.email}</>}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <Selo>{rotuloPapel(u.papel)}</Selo>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={situacao === "ativo" ? "" : "text-muted"}>{ROTULO_SITUACAO[situacao]}</span>
                    {situacao === "aguardando-troca" && u.provisoriaExpiraEm && (
                      <p className="text-xs text-muted">Senha provisória vale até {dataHoraBrasilia(u.provisoriaExpiraEm)}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{u.ultimoAcessoEm ? dataHoraBrasilia(u.ultimoAcessoEm) : <span className="text-muted">Nunca entrou</span>}</td>
                  {podeEditar && (
                    <td className="py-2 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        <Botao variante="discreto" tamanho="sm" onClick={() => setModo({ tipo: "editar", u })} aria-label={`Editar ${u.nome}`}>
                          Editar
                        </Botao>
                        {!voce && (
                          <>
                            <Botao variante="discreto" tamanho="sm" onClick={() => setModo({ tipo: "resetar", u })} aria-label={`Resetar a senha de ${u.nome}`}>
                              Resetar senha
                            </Botao>
                            <Botao variante="discreto" tamanho="sm" onClick={() => setModo({ tipo: "excluir", u })} aria-label={`Excluir ${u.nome}`}>
                              Excluir
                            </Botao>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialogo aberto={modo !== null} aoFechar={fechar} titulo={modo ? titulo[modo.tipo] : ""}>
        {modo?.tipo === "novo" && (
          <FormularioUsuario
            aoCancelar={fechar}
            aoSalvar={async (dados) => {
              const { r, corpo } = await chamar("/api/admin/usuarios/", "POST", dados);
              if (r.ok) concluir({ tipo: "senha", nome: corpo.usuario.nome, usuario: corpo.usuario.usuario, senha: corpo.senhaProvisoria, novo: true });
              return { r, corpo };
            }}
          />
        )}
        {modo?.tipo === "editar" && (
          <FormularioUsuario
            editando={modo.u}
            propriaConta={modo.u.id === atualId}
            aoCancelar={fechar}
            aoSalvar={async (dados) => {
              const { r, corpo } = await chamar(`/api/admin/usuarios/${modo.u.id}/`, "PATCH", dados);
              if (r.ok) concluir();
              return { r, corpo };
            }}
          />
        )}
        {modo?.tipo === "resetar" && (
          <Confirmacao
            texto={
              <>
                Gerar uma nova senha provisória para <strong className="text-ink">{modo.u.nome}</strong>? A senha atual deixa de valer na hora e as
                sessões abertas dessa pessoa são encerradas.
              </>
            }
            acao="Gerar nova senha"
            aoCancelar={fechar}
            aoConfirmar={async () => {
              const { r, corpo } = await chamar(`/api/admin/usuarios/${modo.u.id}/senha/`, "POST");
              if (r.ok) concluir({ tipo: "senha", nome: modo.u.nome, usuario: modo.u.usuario, senha: corpo.senhaProvisoria, novo: false });
              return { r, corpo };
            }}
          />
        )}
        {modo?.tipo === "excluir" && (
          <Confirmacao
            texto={
              <>
                Excluir <strong className="text-ink">{modo.u.nome}</strong> ({modo.u.usuario})? A pessoa perde o acesso na hora. O histórico da
                auditoria continua guardado. Para só suspender o acesso, use “Editar” e desative.
              </>
            }
            acao="Excluir"
            aoCancelar={fechar}
            aoConfirmar={async () => {
              const { r, corpo } = await chamar(`/api/admin/usuarios/${modo.u.id}/`, "DELETE");
              if (r.ok) concluir();
              return { r, corpo };
            }}
          />
        )}
        {modo?.tipo === "senha" && <SenhaGerada {...modo} aoFechar={fechar} />}
      </Dialogo>
    </section>
  );
}

function Selo({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium">{children}</span>;
}

type Resposta = { r: Response; corpo: { erro?: string; campos?: Record<string, string> } };

function FormularioUsuario({
  editando,
  propriaConta = false,
  aoCancelar,
  aoSalvar,
}: {
  editando?: UsuarioLista;
  propriaConta?: boolean;
  aoCancelar: () => void;
  aoSalvar: (dados: unknown) => Promise<Resposta>;
}) {
  const router = useRouter();
  const id = useId();
  const [valores, setValores] = useState({
    nome: editando?.nome ?? "",
    usuario: editando?.usuario ?? "",
    email: editando?.email ?? "",
    papel: (editando?.papel ?? "admin") as Papel,
    ativo: editando?.ativo ?? true,
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const mudar = <K extends keyof typeof valores>(campo: K, valor: (typeof valores)[K]) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: "" }));
  };

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);
    const v = editando
      ? edicaoUsuarioSchema.safeParse({ nome: valores.nome, email: valores.email, papel: valores.papel, ativo: valores.ativo })
      : novoUsuarioSchema.safeParse({ nome: valores.nome, usuario: valores.usuario, email: valores.email, papel: valores.papel });
    if (!v.success) return setErros(errosPorCampo(v.error));
    setEnviando(true);
    try {
      const { r, corpo } = await aoSalvar({ ...v.data, email: v.data.email ?? "" });
      if (r.status === 401) return router.replace("/admin/login/");
      if (!r.ok) {
        setErros(corpo.campos ?? {});
        setErroGeral(corpo.erro ?? "Não foi possível salvar.");
      }
    } catch {
      setErroGeral("Não foi possível salvar. Verifique sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  const texto = (campo: "nome" | "usuario" | "email", rotulo: string, extra: Partial<ComponentProps<typeof Campo>> = {}, dica?: string) => (
    <div>
      <label htmlFor={`${id}-${campo}`} className={classeRotulo}>
        {rotulo}
      </label>
      {dica && (
        <p id={`${id}-${campo}-dica`} className="mt-1 text-sm text-muted">
          {dica}
        </p>
      )}
      <Campo
        id={`${id}-${campo}`}
        value={valores[campo]}
        onChange={(e) => mudar(campo, e.target.value)}
        aria-invalid={Boolean(erros[campo])}
        aria-describedby={[dica && `${id}-${campo}-dica`, erros[campo] && `${id}-${campo}-erro`].filter(Boolean).join(" ") || undefined}
        className="mt-2"
        {...extra}
      />
      <ErroCampo id={`${id}-${campo}-erro`} texto={erros[campo]} />
    </div>
  );

  return (
    <form onSubmit={salvar} noValidate className="space-y-5">
      {texto("nome", "Nome", { autoComplete: "off", maxLength: 80 })}
      {editando ? (
        <p className="text-sm text-muted">
          Usuário: <span className="font-medium text-ink">{editando.usuario}</span> (não pode ser alterado)
        </p>
      ) : (
        texto("usuario", "Usuário", { autoComplete: "off", autoCapitalize: "none", spellCheck: false, maxLength: 40 }, "Usado para entrar. Letras sem acento, números, ponto, hífen ou sublinhado.")
      )}
      {texto("email", "E-mail (opcional)", { type: "email", inputMode: "email", autoComplete: "off", autoCapitalize: "none", spellCheck: false, maxLength: 254 }, "Se preenchido, também serve para entrar.")}

      <fieldset disabled={propriaConta}>
        <legend className={classeRotulo}>Nível de acesso</legend>
        {propriaConta && <p className="mt-1 text-sm text-muted">Você não pode mudar o seu próprio nível nem se desativar.</p>}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PAPEIS.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-strong p-3.5 transition-colors has-[:checked]:border-ink has-[:checked]:bg-surface-2 has-[:disabled]:cursor-not-allowed has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring"
            >
              <input type="radio" name={`${id}-papel`} value={p.id} checked={valores.papel === p.id} onChange={() => mudar("papel", p.id)} className="mt-1 size-4 accent-current" />
              <span>
                <span className="block text-sm font-medium">{p.rotulo}</span>
                <span className="block text-xs leading-relaxed text-muted">{p.descricao}</span>
              </span>
            </label>
          ))}
        </div>
        {editando && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 has-[:disabled]:cursor-not-allowed">
            <input type="checkbox" checked={valores.ativo} onChange={(e) => mudar("ativo", e.target.checked)} className="mt-1 size-4 accent-current" />
            <span>
              <span className="block text-sm font-medium">Acesso ativo</span>
              <span className="block text-xs leading-relaxed text-muted">Desmarcado, a pessoa não consegue entrar e as sessões abertas dela são encerradas.</span>
            </span>
          </label>
        )}
      </fieldset>

      {!editando && (
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
          Ao salvar, o sistema gera uma <strong className="font-medium text-ink">senha provisória</strong> (vale 24 horas). No primeiro acesso, a
          pessoa cria a própria senha.
        </p>
      )}
      {erroGeral && <Alerta>{erroGeral}</Alerta>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Botao variante="discreto" tamanho="sm" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" tamanho="sm" disabled={enviando} className="sm:min-w-28">
          {enviando && <Girando />}
          {editando ? "Salvar" : "Criar usuário"}
        </Botao>
      </div>
    </form>
  );
}

function Confirmacao({
  texto,
  acao,
  aoCancelar,
  aoConfirmar,
}: {
  texto: ReactNode;
  acao: string;
  aoCancelar: () => void;
  aoConfirmar: () => Promise<Resposta>;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      const { r, corpo } = await aoConfirmar();
      if (r.status === 401) return router.replace("/admin/login/");
      if (!r.ok) setErro(corpo.erro ?? "Não foi possível concluir.");
    } catch {
      setErro("Não foi possível concluir. Verifique sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-muted">{texto}</p>
      {erro && <Alerta>{erro}</Alerta>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Botao variante="discreto" tamanho="sm" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao tamanho="sm" onClick={confirmar} disabled={enviando}>
          {enviando && <Girando />}
          {acao}
        </Botao>
      </div>
    </div>
  );
}

/** Mostra a senha provisória uma única vez, para o master copiar e repassar. */
function SenhaGerada({ nome, usuario, senha, novo, aoFechar }: { nome: string; usuario: string; senha: string; novo: boolean; aoFechar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-muted">
        {novo ? "Usuário criado." : "Senha resetada."} Envie a senha abaixo para <strong className="text-ink">{nome}</strong> por um canal
        seguro, separada do nome de usuário (<strong className="text-ink">{usuario}</strong>).
      </p>
      <div className="flex items-center gap-2 rounded-2xl border border-line-strong bg-surface-2 p-2 pl-4">
        <code aria-label="Senha provisória" className="min-w-0 flex-1 select-all break-all font-mono text-lg tracking-wide">
          {senha}
        </code>
        <Botao variante="secundario" tamanho="sm" onClick={copiar}>
          {copiado ? (
            <>
              <IconeCheck tamanho={16} /> Copiada
            </>
          ) : (
            "Copiar"
          )}
        </Botao>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Ela aparece só agora: não fica salva em lugar nenhum.</li>
        <li>Vale por 24 horas. Depois disso, gere outra em “Resetar senha”.</li>
        <li>No primeiro acesso, a pessoa precisa criar a própria senha.</li>
      </ul>
      <div className="flex justify-end">
        <Botao tamanho="sm" onClick={aoFechar}>
          Concluir
        </Botao>
      </div>
    </div>
  );
}
