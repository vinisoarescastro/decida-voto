"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Botao } from "@/components/ui/button";
import { MaisDetalhes } from "@/components/ui/disclosure";
import { Alerta, AreaTexto, Campo, ErroCampo, Selecao, classeRotulo } from "@/components/ui/field";
import { Girando, IconeAlerta, IconeCheck, IconeChevronBaixo } from "@/components/ui/icon";
import { MarcadorCandidato } from "@/components/ui/text";
import { camposAlterados, rascunhoDoPublicado, validarRascunho, type PosicaoRascunho, type Rascunho, type Referencia } from "@/lib/revisao";
import type { Candidate } from "@/lib/schema";

type Props = {
  numero: number;
  referencia: Referencia;
  candidatos: Candidate[];
  /** Rascunho salvo no banco (null = pergunta igual à publicada). */
  inicial: Rascunho | null;
  /** O rascunho foi feito sobre uma versão anterior dos arquivos publicados. */
  desatualizado: boolean;
  /** Fontes de cada candidato, já renderizadas no servidor. */
  fontes: Record<string, ReactNode>;
};

// Seleção de alternativa por candidato: a cor do marcador identifica o candidato, sempre com o nome ao lado.
const SELECAO_CANDIDATO = [
  "has-[:checked]:border-cand-1 has-[:checked]:bg-cand-1/10",
  "has-[:checked]:border-cand-2 has-[:checked]:bg-cand-2/10",
] as const;

const CONFIANCA = { alta: "Alta", media: "Média" } as const;

/** Revisão de uma pergunta: texto, alternativas, alternativa de cada candidato e justificativas. */
export function RevisaoPergunta({ numero, referencia, candidatos, inicial, desatualizado, fontes }: Props) {
  const router = useRouter();
  const id = useId();
  const publicado = useMemo(() => rascunhoDoPublicado(referencia), [referencia]);
  const [valores, setValores] = useState<Rascunho>(inicial ?? publicado);
  const [salvos, setSalvos] = useState<Rascunho | null>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const alterados = camposAlterados(publicado, valores);
  const salvosAlterados = salvos ? camposAlterados(publicado, salvos).size : 0;
  const naoSalvo = JSON.stringify(valores) !== JSON.stringify(salvos ?? publicado);
  const campoId = (caminho: string) => `${id}-${caminho.replaceAll(".", "-")}`;

  // Opções na ordem da escala (1 a 4), mantendo o índice original para o caminho do campo.
  const opcoes = referencia.pergunta.options.map((o, i) => ({ ...o, indice: i })).sort((a, b) => a.value - b.value);
  const textoDaAlternativa = (valor: number | null) =>
    valor === null ? null : valores.pergunta.options[opcoes.find((o) => o.value === valor)!.indice].text;

  function limparErro(caminho: string) {
    setErros((e) => (e[caminho] ? { ...e, [caminho]: "" } : e));
    setAviso(null);
  }

  function mudarPergunta(campo: "theme" | "text" | "context", valor: string) {
    setValores((v) => ({ ...v, pergunta: { ...v.pergunta, [campo]: valor } }));
    limparErro(`pergunta.${campo}`);
  }

  function mudarAlternativa(indice: number, valor: string) {
    setValores((v) => ({
      ...v,
      pergunta: { ...v.pergunta, options: v.pergunta.options.map((o, i) => (i === indice ? { ...o, text: valor } : o)) },
    }));
    limparErro(`pergunta.options.${indice}.text`);
  }

  function mudarPosicao(cid: string, mudanca: Partial<PosicaoRascunho>) {
    setValores((v) => ({ ...v, posicoes: { ...v.posicoes, [cid]: { ...v.posicoes[cid], ...mudanca } } }));
    for (const campo of Object.keys(mudanca)) limparErro(`posicoes.${cid}.${campo}`);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);
    setAviso(null);
    const v = validarRascunho(referencia, valores);
    if (!v.ok) {
      setErros(v.erros);
      setErroGeral(v.erros.geral ?? "Confira os campos destacados.");
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch("/api/admin/revisao/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perguntaId: referencia.pergunta.id, rascunho: v.rascunho }),
      });
      if (r.status === 401) {
        router.replace("/admin/login/");
        return;
      }
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErros(corpo.campos ?? {});
        setErroGeral(corpo.erro ?? "Não foi possível salvar.");
        return;
      }
      setValores(corpo.rascunho);
      setSalvos(corpo.rascunho);
      setErros({});
      setAviso("Rascunho salvo. O site público só muda depois da exportação e publicação.");
      router.refresh();
    } catch {
      setErroGeral("Não foi possível salvar. Verifique sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  async function descartar() {
    if (!window.confirm("Descartar o rascunho desta pergunta? Ela volta ao conteúdo publicado, sem a nota e sem a marcação de revisada.")) return;
    setErroGeral(null);
    setEnviando(true);
    try {
      const r = await fetch(`/api/admin/revisao/?pergunta=${encodeURIComponent(referencia.pergunta.id)}`, { method: "DELETE" });
      if (r.status === 401) {
        router.replace("/admin/login/");
        return;
      }
      if (!r.ok) {
        setErroGeral("Não foi possível descartar.");
        return;
      }
      setValores(publicado);
      setSalvos(null);
      setErros({});
      setAviso("Rascunho descartado. A pergunta voltou ao conteúdo publicado.");
      router.refresh();
    } catch {
      setErroGeral("Não foi possível descartar. Verifique sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  /** Estado de um campo pelo caminho: id, erro e se difere do publicado. */
  const estado = (caminho: string) => ({ id: campoId(caminho), erro: erros[caminho], alterado: alterados.has(caminho) });

  return (
    <details className="group/pergunta rounded-3xl border border-line bg-surface/90 shadow-sm" id={`pergunta-${referencia.pergunta.id}`}>
      <summary className="flex min-h-16 cursor-pointer items-start justify-between gap-4 rounded-3xl px-5 py-4 transition-colors hover:bg-surface-2/60 sm:px-6">
        <span className="min-w-0">
          <span className="block text-xs font-medium text-muted">
            {numero}. {valores.pergunta.theme}
          </span>
          <span className="mt-1 block font-medium">{valores.pergunta.text}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {salvos?.revisada ? (
              <Selo tom="ok">
                <IconeCheck tamanho={14} /> Revisada
              </Selo>
            ) : (
              <Selo>Pendente</Selo>
            )}
            {salvosAlterados > 0 && <Selo>Rascunho com {salvosAlterados} {salvosAlterados === 1 ? "alteração" : "alterações"}</Selo>}
            {naoSalvo && <Selo tom="alerta">Não salvo</Selo>}
          </span>
        </span>
        <IconeChevronBaixo className="mt-1 shrink-0 text-muted transition-transform duration-200 group-open/pergunta:rotate-180" />
      </summary>

      <form onSubmit={salvar} noValidate className="space-y-8 border-t border-line px-5 pb-6 pt-5 sm:px-6">
        {desatualizado && (
          <p className="flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            <IconeAlerta className="mt-0.5 shrink-0" />
            <span>
              Este rascunho foi salvo sobre uma versão anterior do conteúdo publicado. Compare com o texto atual (indicado em
              “Publicado”) antes de exportar.
            </span>
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">Pergunta</legend>
          <CampoTexto {...estado("pergunta.theme")} rotulo="Tema" valor={valores.pergunta.theme} original={publicado.pergunta.theme} maximo={60} onChange={(v) => mudarPergunta("theme", v)} />
          <CampoTexto {...estado("pergunta.text")} rotulo="Pergunta" valor={valores.pergunta.text} original={publicado.pergunta.text} maximo={200} multilinha onChange={(v) => mudarPergunta("text", v)} />
          <CampoTexto
            {...estado("pergunta.context")}
            rotulo="Texto de apoio (aparece abaixo da pergunta)"
            valor={valores.pergunta.context}
            original={publicado.pergunta.context}
            maximo={400}
            multilinha
            onChange={(v) => mudarPergunta("context", v)}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Alternativas e candidatos</legend>
          <p className="text-sm text-muted">
            Edite o texto e marque em qual alternativa cada candidato está. Os dois podem ficar na mesma. No questionário, a
            ordem é sorteada; aqui elas aparecem na ordem da escala (1 a 4).
          </p>
          {opcoes.map((o) => {
            const caminho = `pergunta.options.${o.indice}.text`;
            return (
              <div key={o.id} className="rounded-2xl border border-line p-4">
                <CampoTexto
                  {...estado(caminho)}
                  rotulo={`Alternativa ${o.value}`}
                  valor={valores.pergunta.options[o.indice].text}
                  original={publicado.pergunta.options[o.indice].text}
                  maximo={200}
                  multilinha
                  onChange={(v) => mudarAlternativa(o.indice, v)}
                />
                <p className="mt-3 text-xs font-medium text-muted">Candidatos nesta alternativa</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidatos.map((c, i) => (
                    <OpcaoCandidato
                      key={c.id}
                      nome={`${id}-cand-${c.id}`}
                      indice={i}
                      marcado={valores.posicoes[c.id].value === o.value}
                      onChange={() => mudarPosicao(c.id, { value: o.value })}
                    >
                      {c.name}
                    </OpcaoCandidato>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="rounded-2xl border border-dashed border-line-strong p-4">
            <p className="text-sm font-medium">Sem posição documentada</p>
            <p className="mt-1 text-xs text-muted">Use quando as fontes não permitem afirmar a posição. O tema não conta na afinidade desse candidato.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidatos.map((c, i) => (
                <OpcaoCandidato key={c.id} nome={`${id}-cand-${c.id}`} indice={i} marcado={valores.posicoes[c.id].value === null} onChange={() => mudarPosicao(c.id, { value: null })}>
                  {c.name}
                </OpcaoCandidato>
              ))}
            </div>
          </div>
          {candidatos.map((c) => (
            <ErroCampo key={c.id} id={campoId(`posicoes.${c.id}.value`)} texto={erros[`posicoes.${c.id}.value`] && `${c.name}: ${erros[`posicoes.${c.id}.value`]}`} />
          ))}
        </fieldset>

        {candidatos.map((c, i) => {
          const p = valores.posicoes[c.id];
          const pub = publicado.posicoes[c.id];
          const base = `posicoes.${c.id}`;
          const marcada = textoDaAlternativa(p.value);
          const textoPublicado = pub.value === null ? "sem posição documentada" : `alternativa ${pub.value}`;
          return (
            <fieldset key={c.id} className="space-y-4">
              <legend className="flex items-center gap-2 text-sm font-semibold">
                <MarcadorCandidato indice={i} />
                Posição de {c.name}
              </legend>
              <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm">
                {p.value === null ? (
                  <span>Sem posição documentada.</span>
                ) : (
                  <span>
                    <strong>Alternativa {p.value}:</strong> {marcada}
                  </span>
                )}
                {alterados.has(`${base}.value`) && <span className="mt-1 block text-xs text-muted">Alterado. Publicado: {textoPublicado}.</span>}
              </div>

              <div>
                <label htmlFor={campoId(`${base}.confidence`)} className={classeRotulo}>
                  Confiança
                </label>
                <Selecao
                  id={campoId(`${base}.confidence`)}
                  value={p.value === null ? "" : (p.confidence ?? "")}
                  disabled={p.value === null}
                  onChange={(e) => mudarPosicao(c.id, { confidence: (e.target.value || null) as PosicaoRascunho["confidence"] })}
                  aria-invalid={Boolean(erros[`${base}.confidence`])}
                  aria-describedby={erros[`${base}.confidence`] ? `${campoId(`${base}.confidence`)}-erro` : undefined}
                  className="mt-2 sm:max-w-60"
                >
                  <option value="">{p.value === null ? "Não se aplica" : "Escolha"}</option>
                  {Object.entries(CONFIANCA).map(([v, r]) => (
                    <option key={v} value={v}>
                      {r}
                    </option>
                  ))}
                </Selecao>
                <ErroCampo id={`${campoId(`${base}.confidence`)}-erro`} texto={erros[`${base}.confidence`]} />
                <Alteracao alterado={alterados.has(`${base}.confidence`)} original={pub.confidence ? CONFIANCA[pub.confidence] : "não se aplica"} />
              </div>

              <CampoTexto {...estado(`${base}.summary`)} rotulo="Resumo da posição" valor={p.summary} original={pub.summary} maximo={1500} multilinha onChange={(v) => mudarPosicao(c.id, { summary: v })} />
              <CampoTexto
                {...estado(`${base}.rationale`)}
                rotulo="Justificativa da alternativa escolhida"
                valor={p.rationale}
                original={pub.rationale}
                maximo={3000}
                multilinha
                onChange={(v) => mudarPosicao(c.id, { rationale: v })}
              />
              {alterados.has(`${base}.value`) && !alterados.has(`${base}.rationale`) && (
                <p className="text-xs text-muted">A alternativa mudou: confira se o resumo e a justificativa ainda fazem sentido.</p>
              )}

              <MaisDetalhes rotulo={`Fontes cadastradas (${referencia.posicoes[c.id].evidence.length})`}>
                {referencia.posicoes[c.id].evidence.length > 0 ? fontes[c.id] : <p className="text-sm text-muted">Nenhuma fonte cadastrada.</p>}
              </MaisDetalhes>
            </fieldset>
          );
        })}

        <fieldset className="space-y-4 rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">Revisão</legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={valores.revisada}
              onChange={(e) => setValores((v) => ({ ...v, revisada: e.target.checked }))}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink"
            />
            <span>
              <strong className="font-medium">Pergunta revisada.</strong> Conferi as fontes, a alternativa de cada candidato e
              apliquei o mesmo critério aos dois.
            </span>
          </label>
          <div>
            <label htmlFor={campoId("nota")} className={classeRotulo}>
              Nota da revisão
            </label>
            <p className="mt-1 text-xs text-muted">Uso interno, não aparece no site. Registre o motivo das mudanças. Não inclua dados pessoais.</p>
            <AreaTexto
              id={campoId("nota")}
              value={valores.nota}
              maxLength={2000}
              onChange={(e) => {
                setValores((v) => ({ ...v, nota: e.target.value }));
                limparErro("nota");
              }}
              aria-invalid={Boolean(erros.nota)}
              aria-describedby={erros.nota ? `${campoId("nota")}-erro` : undefined}
              className="mt-2"
            />
            <ErroCampo id={`${campoId("nota")}-erro`} texto={erros.nota} />
          </div>
        </fieldset>

        {erroGeral && <Alerta>{erroGeral}</Alerta>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <p role="status" className="text-sm text-muted sm:mr-auto">
            {aviso && (
              <span className="inline-flex items-center gap-1.5">
                <IconeCheck tamanho={16} className="text-ink" />
                {aviso}
              </span>
            )}
          </p>
          {salvos && (
            <Botao variante="discreto" tamanho="sm" onClick={descartar} disabled={enviando}>
              Descartar rascunho
            </Botao>
          )}
          <Botao type="submit" tamanho="sm" disabled={enviando || !naoSalvo} className="sm:min-w-28">
            {enviando && <Girando />}
            {enviando ? "Salvando" : "Salvar"}
          </Botao>
        </div>
      </form>
    </details>
  );
}

function Selo({ children, tom }: { children: ReactNode; tom?: "ok" | "alerta" }) {
  const cor = tom === "ok" ? "bg-ink text-bg" : tom === "alerta" ? "bg-danger-soft text-danger" : "bg-surface-2 text-ink";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cor}`}>{children}</span>;
}

function OpcaoCandidato({ nome, indice, marcado, onChange, children }: { nome: string; indice: number; marcado: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-sm transition-colors hover:border-ink/40 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring ${SELECAO_CANDIDATO[indice]}`}
    >
      <input type="radio" name={nome} checked={marcado} onChange={onChange} className="size-4 cursor-pointer accent-ink" />
      <MarcadorCandidato indice={indice} />
      {children}
    </label>
  );
}

/** Destaque de campo alterado, com o texto publicado para comparação. */
function Alteracao({ alterado, original }: { alterado: boolean; original?: string }) {
  if (!alterado) return null;
  return (
    <p className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
      <strong className="font-semibold text-ink">Alterado.</strong>
      {original !== undefined && <> Publicado: “{original}”</>}
    </p>
  );
}

function CampoTexto({ id, erro, alterado, rotulo, valor, original, maximo, multilinha, onChange }: {
  id: string;
  erro?: string;
  alterado: boolean;
  rotulo: string;
  valor: string;
  original: string;
  maximo: number;
  multilinha?: boolean;
  onChange: (v: string) => void;
}) {
  const campo = {
    id,
    value: valor,
    maxLength: maximo,
    "aria-invalid": Boolean(erro),
    "aria-describedby": erro ? `${id}-erro` : undefined,
    className: "mt-2",
  };
  return (
    <div>
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
      </label>
      {multilinha ? <AreaTexto {...campo} onChange={(e) => onChange(e.target.value)} /> : <Campo {...campo} onChange={(e) => onChange(e.target.value)} />}
      <ErroCampo id={`${id}-erro`} texto={erro} />
      <Alteracao alterado={alterado} original={original} />
    </div>
  );
}
