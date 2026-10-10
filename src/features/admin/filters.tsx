"use client";

import { useState } from "react";
import { FAIXAS_ETARIAS, GENEROS, UFS } from "@/lib/perfil";
import { Botao, BotaoLink } from "@/components/ui/button";
import { Selecao } from "@/components/ui/field";
import { IconeChevronBaixo } from "@/components/ui/icon";

type Props = {
  valores: { uf?: string; municipio?: number; genero?: string; faixa?: string };
  municipiosDaUf: [number, string][];
};

const rotulo = "text-xs font-medium text-muted";

/** Filtros por GET (a URL guarda o recorte). No celular ficam recolhidos; trocar a UF recarrega as cidades. */
export function Filtros({ valores, municipiosDaUf }: Props) {
  const ativos = [valores.uf, valores.municipio, valores.genero, valores.faixa].filter(Boolean).length;
  const [aberto, setAberto] = useState(false);

  return (
    <form method="get" action="/admin/" className="rounded-3xl border border-line bg-surface/90 shadow-sm">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className="flex min-h-14 w-full items-center justify-between px-5 text-left sm:hidden"
      >
        <span className="font-medium">
          Filtros {ativos > 0 && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-xs text-bg">{ativos}</span>}
        </span>
        <IconeChevronBaixo className={`text-muted transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      <div className={`${aberto ? "block" : "hidden"} border-t border-line p-5 sm:block sm:border-0`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={rotulo}>
            Estado
            <Selecao
              name="uf"
              defaultValue={valores.uf ?? ""}
              className="mt-1.5"
              onChange={(e) => {
                const form = e.currentTarget.form!;
                (form.elements.namedItem("municipio") as HTMLSelectElement).value = "";
                form.requestSubmit();
              }}
            >
              <option value="">Todos</option>
              {UFS.map((u) => (
                <option key={u.sigla} value={u.sigla}>
                  {u.nome}
                </option>
              ))}
            </Selecao>
          </label>
          <label className={rotulo}>
            Cidade
            <Selecao name="municipio" defaultValue={valores.municipio ?? ""} disabled={!valores.uf} className="mt-1.5">
              <option value="">{valores.uf ? "Todas" : "Escolha o estado"}</option>
              {municipiosDaUf.map(([codigo, nome]) => (
                <option key={codigo} value={codigo}>
                  {nome}
                </option>
              ))}
            </Selecao>
          </label>
          <label className={rotulo}>
            Gênero
            <Selecao name="genero" defaultValue={valores.genero ?? ""} className="mt-1.5">
              <option value="">Todos</option>
              {GENEROS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Selecao>
          </label>
          <label className={rotulo}>
            Faixa etária
            <Selecao name="faixa" defaultValue={valores.faixa ?? ""} className="mt-1.5">
              <option value="">Todas</option>
              {FAIXAS_ETARIAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Selecao>
          </label>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {ativos > 0 && (
            <BotaoLink href="/admin/" variante="discreto" tamanho="sm">
              Limpar
            </BotaoLink>
          )}
          <Botao type="submit" tamanho="sm">
            Aplicar
          </Botao>
        </div>
      </div>
    </form>
  );
}
