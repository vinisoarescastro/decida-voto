"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type RefObject } from "react";
import { GENEROS, UFS, validarIdade, type Genero } from "@/lib/perfil";
import { Botao } from "@/components/ui/button";
import { Alerta, Campo, ErroCampo, Selecao, classeRotulo } from "@/components/ui/field";
import { Girando } from "@/components/ui/icon";
import { Sobretitulo } from "@/components/ui/text";
import { BarraAcoes } from "./action-bar";

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
  valor: PerfilForm;
  aoMudar: (p: PerfilForm) => void;
  aoContinuar: () => void;
  enviando: boolean;
  erroGeral: string | null;
  tituloRef: RefObject<HTMLHeadingElement | null>;
};

export function FormularioPerfil({ valor, aoMudar, aoContinuar, enviando, erroGeral, tituloRef }: Props) {
  const id = useId();
  const [erros, setErros] = useState<Erros>({});
  const [municipios, setMunicipios] = useState<[number, string][] | null>(null);

  const alterar = (parcial: Partial<PerfilForm>) => {
    aoMudar({ ...valor, ...parcial });
    // O erro some enquanto a pessoa corrige o campo. Se sumisse só ao sair do campo, o layout
    // mudaria no instante do toque em "Continuar" e o toque poderia se perder.
    setErros((anteriores) => {
      const proximos = { ...anteriores };
      for (const campo of Object.keys(parcial)) delete proximos[campo as keyof Erros];
      return proximos;
    });
  };

  useEffect(() => {
    if (!valor.uf) return;
    let ativo = true;
    fetch(`/api/municipios/${valor.uf}/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: [number, string][]) => ativo && setMunicipios(lista))
      .catch(() => ativo && setMunicipios([]));
    return () => {
      ativo = false;
    };
  }, [valor.uf]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validarPerfil(valor);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      // Leva o foco ao primeiro campo com problema (útil no celular, onde ele pode estar fora da tela).
      const primeiro = (["uf", "municipio", "genero", "idade"] as const).find((c) => encontrados[c]);
      document.getElementById(`${id}-${primeiro}`)?.focus();
      return;
    }
    aoContinuar();
  }

  const aria = (nome: keyof Erros) => ({
    "aria-invalid": Boolean(erros[nome]) || undefined,
    "aria-describedby": erros[nome] ? `${id}-${nome}-erro` : undefined,
  });

  return (
    <form onSubmit={enviar} noValidate className="animate-surgir flex flex-1 flex-col">
      <Sobretitulo>Etapa 1 de 2</Sobretitulo>
      <h1 ref={tituloRef} tabIndex={-1} className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight muito-baixa:mt-2 muito-baixa:text-2xl sm:text-3xl">
        Antes de começar
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted muito-baixa:mt-2 muito-baixa:text-sm">
        Estas informações são usadas apenas em estatísticas gerais. Não pedimos nome, e-mail, CPF ou qualquer dado que
        identifique você.
      </p>

      {/* No celular, Estado e Cidade ocupam a linha inteira (nomes longos); Gênero e Idade dividem uma linha. */}
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 baixa:mt-6 baixa:gap-y-4 muito-baixa:mt-4 muito-baixa:gap-y-3 sm:gap-x-5">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-uf`} className={classeRotulo}>
            Estado
          </label>
          <Selecao
            id={`${id}-uf`}
            value={valor.uf}
            onChange={(e) => {
              setMunicipios(null);
              alterar({ uf: e.target.value, municipio: "" });
            }}
            className="mt-2"
            {...aria("uf")}
          >
            <option value="">Selecione</option>
            {UFS.map((u) => (
              <option key={u.sigla} value={u.sigla}>
                {u.nome}
              </option>
            ))}
          </Selecao>
          <ErroCampo id={`${id}-uf-erro`} texto={erros.uf} />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${id}-municipio`} className={classeRotulo}>
            Cidade
          </label>
          <Selecao
            id={`${id}-municipio`}
            value={valor.municipio}
            onChange={(e) => alterar({ municipio: e.target.value })}
            disabled={!valor.uf || municipios === null}
            className="mt-2"
            {...aria("municipio")}
          >
            <option value="">{!valor.uf ? "Escolha o estado primeiro" : municipios === null ? "Carregando cidades…" : "Selecione"}</option>
            {municipios?.map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>
                {nome}
              </option>
            ))}
          </Selecao>
          <ErroCampo id={`${id}-municipio-erro`} texto={erros.municipio} />
        </div>

        <fieldset {...aria("genero")}>
          <legend className={classeRotulo}>Gênero</legend>
          <div
            id={`${id}-genero`}
            tabIndex={-1}
            className={`mt-2 grid h-13 grid-cols-2 gap-1 rounded-2xl border bg-surface-2 p-1 transition-colors ${
              erros.genero ? "border-danger" : "border-line-strong"
            }`}
          >
            {GENEROS.map((g) => {
              const marcado = valor.genero === g.id;
              return (
                <label
                  key={g.id}
                  className={`grid cursor-pointer place-items-center rounded-xl text-[15px] transition-[background-color,color,box-shadow] duration-150 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring ${
                    marcado ? "bg-ink font-medium text-bg shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-genero`}
                    value={g.id}
                    checked={marcado}
                    onChange={() => alterar({ genero: g.id })}
                    className="sr-only"
                  />
                  {g.label}
                </label>
              );
            })}
          </div>
          <ErroCampo id={`${id}-genero-erro`} texto={erros.genero} />
        </fieldset>

        <div>
          <label htmlFor={`${id}-idade`} className={classeRotulo}>
            Idade
          </label>
          <Campo
            id={`${id}-idade`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={3}
            placeholder="Ex.: 35"
            value={valor.idade}
            // Só dígitos: letras, sinais e separadores são descartados enquanto a pessoa digita.
            onChange={(e) => alterar({ idade: e.target.value.replace(/\D/g, "") })}
            onBlur={() => {
              if (!valor.idade) return;
              const r = validarIdade(valor.idade);
              if (!r.ok) setErros((anteriores) => ({ ...anteriores, idade: r.erro }));
            }}
            className="mt-2"
            {...aria("idade")}
          />
          <ErroCampo id={`${id}-idade-erro`} texto={erros.idade} />
        </div>
      </div>

      {/* Campo-isca: oculto para pessoas e leitores de tela; robôs costumam preenchê-lo. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-site`}>Site</label>
        <input id={`${id}-site`} name="site" tabIndex={-1} autoComplete="off" value={valor.site} onChange={(e) => alterar({ site: e.target.value })} />
      </div>

      {erroGeral && (
        <div className="mt-8">
          <Alerta>{erroGeral}</Alerta>
        </div>
      )}

      <BarraAcoes
        nota={
          // Ciência e concordância: o clique em "Continuar" registra o consentimento enviado ao servidor.
          <p id={`${id}-aviso`} className="mb-3 text-xs leading-relaxed text-muted muito-baixa:mb-2 sm:mb-5 sm:max-w-md sm:baixa:mb-3">
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
        }
      >
        <Botao type="submit" aria-describedby={`${id}-aviso`} disabled={enviando} className="w-full sm:w-auto sm:min-w-40">
          {enviando && <Girando />}
          {enviando ? "Aguarde" : "Continuar"}
        </Botao>
      </BarraAcoes>
    </form>
  );
}
