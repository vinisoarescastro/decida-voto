"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type RefObject } from "react";
import { GENEROS, IDADE_MAXIMA, IDADE_MINIMA, UFS, validarIdade, type Genero } from "@/lib/perfil";

export type PerfilForm = {
  uf: string;
  municipio: string;
  genero: Genero | "";
  idade: string;
  /** Campo-isca: deve ficar vazio. */
  site: string;
};

export const PERFIL_VAZIO: PerfilForm = { uf: "", municipio: "", genero: "", idade: "", site: "" };

type Erros = Partial<Record<"uf" | "municipio" | "genero" | "idade", string>>;

export function validarPerfil(p: PerfilForm): Erros {
  const erros: Erros = {};
  if (!p.uf) erros.uf = "Selecione seu estado.";
  if (!p.municipio) erros.municipio = "Selecione sua cidade.";
  if (!p.genero) erros.genero = "Selecione uma opção.";
  const idade = validarIdade(p.idade);
  if (!idade.ok) erros.idade = idade.erro;
  return erros;
}

type Props = {
  value: PerfilForm;
  onChange: (p: PerfilForm) => void;
  onSubmit: () => void;
  enviando: boolean;
  erroGeral: string | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

const campo = "mt-2 w-full rounded-xl border border-line bg-bg/70 px-4 py-3 backdrop-blur-sm focus:border-accent focus:outline-none";
const rotulo = "text-sm font-medium";

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {texto}
    </p>
  );
}

export function ProfileStep({ value, onChange, onSubmit, enviando, erroGeral, headingRef }: Props) {
  const id = useId();
  const [erros, setErros] = useState<Erros>({});
  const [municipios, setMunicipios] = useState<[number, string][] | null>(null);
  const set = (parcial: Partial<PerfilForm>) => {
    onChange({ ...value, ...parcial });
    // Limpa o erro do campo enquanto a pessoa edita. Se fosse ao sair do campo, o layout "pularia"
    // no exato momento do toque em "Continuar" e o clique poderia se perder (especialmente no celular).
    setErros((prev) => {
      const proximo = { ...prev };
      for (const campo of Object.keys(parcial)) delete proximo[campo as keyof Erros];
      return proximo;
    });
  };

  useEffect(() => {
    if (!value.uf) return;
    let ativo = true;
    fetch(`/api/municipios/${value.uf}/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: [number, string][]) => ativo && setMunicipios(lista))
      .catch(() => ativo && setMunicipios([]));
    return () => {
      ativo = false;
    };
  }, [value.uf]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validarPerfil(value);
    setErros(encontrados);
    if (Object.keys(encontrados).length === 0) onSubmit();
  }

  const aria = (nome: keyof Erros) => ({
    "aria-invalid": Boolean(erros[nome]) || undefined,
    "aria-describedby": erros[nome] ? `${id}-${nome}-erro` : undefined,
  });

  return (
    <form onSubmit={enviar} noValidate>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
        Antes de começar
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Estas informações são usadas apenas em estatísticas gerais. Não pedimos nome, e-mail, CPF ou qualquer dado que
        identifique você.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-uf`} className={rotulo}>
            Estado
          </label>
          <select
            id={`${id}-uf`}
            value={value.uf}
            onChange={(e) => {
              setMunicipios(null);
              set({ uf: e.target.value, municipio: "" });
            }}
            className={campo}
            {...aria("uf")}
          >
            <option value="">Selecione</option>
            {UFS.map((u) => (
              <option key={u.sigla} value={u.sigla}>
                {u.nome}
              </option>
            ))}
          </select>
          <Erro id={`${id}-uf-erro`} texto={erros.uf} />
        </div>

        <div>
          <label htmlFor={`${id}-municipio`} className={rotulo}>
            Cidade
          </label>
          <select
            id={`${id}-municipio`}
            value={value.municipio}
            onChange={(e) => set({ municipio: e.target.value })}
            disabled={!value.uf || municipios === null}
            className={`${campo} disabled:opacity-50`}
            {...aria("municipio")}
          >
            <option value="">{!value.uf ? "Escolha o estado primeiro" : municipios === null ? "Carregando…" : "Selecione"}</option>
            {municipios?.map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>
                {nome}
              </option>
            ))}
          </select>
          <Erro id={`${id}-municipio-erro`} texto={erros.municipio} />
        </div>

        <fieldset {...aria("genero")}>
          <legend className={rotulo}>Gênero</legend>
          <div className="mt-2 inline-flex rounded-full bg-surface-2 p-1">
            {GENEROS.map((g) => (
              <label
                key={g.id}
                className={`cursor-pointer rounded-full px-5 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  value.genero === g.id ? "bg-bg font-medium shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-genero`}
                  value={g.id}
                  checked={value.genero === g.id}
                  onChange={() => set({ genero: g.id })}
                  className="sr-only"
                />
                {g.label}
              </label>
            ))}
          </div>
          <Erro id={`${id}-genero-erro`} texto={erros.genero} />
        </fieldset>

        <div>
          <label htmlFor={`${id}-idade`} className={rotulo}>
            Idade
          </label>
          <input
            id={`${id}-idade`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            placeholder={`${IDADE_MINIMA} a ${IDADE_MAXIMA}`}
            value={value.idade}
            onChange={(e) => set({ idade: e.target.value })}
            onBlur={() => {
              if (!value.idade) return;
              const r = validarIdade(value.idade);
              if (!r.ok) setErros((prev) => ({ ...prev, idade: r.erro }));
            }}
            className={campo}
            {...aria("idade")}
          />
          <Erro id={`${id}-idade-erro`} texto={erros.idade} />
        </div>
      </div>

      {/* Campo-isca: oculto para pessoas e leitores de tela; robôs costumam preenchê-lo. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-site`}>Site</label>
        <input id={`${id}-site`} name="site" tabIndex={-1} autoComplete="off" value={value.site} onChange={(e) => set({ site: e.target.value })} />
      </div>

      {erroGeral && (
        <p role="alert" className="mt-6 text-sm text-danger">
          {erroGeral}
        </p>
      )}

      {/* Ciência e concordância: o clique em "Continuar" registra o consentimento enviado ao servidor. */}
      <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${id}-aviso`} className="max-w-sm text-xs leading-relaxed text-muted">
          Ao clicar em “Continuar”, você declara estar ciente e de acordo com os{" "}
          <Link href="/privacidade/#termos" target="_blank" className="underline underline-offset-2 hover:text-ink">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade/" target="_blank" className="underline underline-offset-2 hover:text-ink">
            Política de privacidade
          </Link>
          , incluindo o armazenamento das suas respostas, sem identificação pessoal, para estatísticas.
        </p>
        <button
          type="submit"
          aria-describedby={`${id}-aviso`}
          disabled={enviando}
          className="shrink-0 self-end rounded-full bg-ink px-7 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:opacity-40 sm:self-auto"
        >
          {enviando ? "Aguarde…" : "Continuar"}
        </button>
      </div>
    </form>
  );
}
