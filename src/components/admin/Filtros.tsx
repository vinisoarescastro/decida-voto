"use client";

import Link from "next/link";
import { FAIXAS_ETARIAS, GENEROS, UFS } from "@/lib/perfil";

type Props = {
  valores: { uf?: string; municipio?: number; genero?: string; faixa?: string };
  municipiosDaUf: [number, string][];
};

const campo = "w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm focus:border-accent focus:outline-none";

/** Filtros por GET (a URL guarda o recorte). Trocar a UF recarrega a lista de cidades. */
export function Filtros({ valores, municipiosDaUf }: Props) {
  return (
    <form method="get" action="/admin/" className="grid gap-3 sm:grid-cols-[1fr_1.4fr_1fr_1fr_auto] sm:items-end">
      <label className="text-xs text-muted">
        Estado
        <select
          name="uf"
          defaultValue={valores.uf ?? ""}
          className={`${campo} mt-1`}
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
        </select>
      </label>
      <label className="text-xs text-muted">
        Cidade
        <select name="municipio" defaultValue={valores.municipio ?? ""} disabled={!valores.uf} className={`${campo} mt-1 disabled:opacity-50`}>
          <option value="">{valores.uf ? "Todas" : "Escolha o estado"}</option>
          {municipiosDaUf.map(([codigo, nome]) => (
            <option key={codigo} value={codigo}>
              {nome}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        Gênero
        <select name="genero" defaultValue={valores.genero ?? ""} className={`${campo} mt-1`}>
          <option value="">Todos</option>
          {GENEROS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        Faixa etária
        <select name="faixa" defaultValue={valores.faixa ?? ""} className={`${campo} mt-1`}>
          <option value="">Todas</option>
          {FAIXAS_ETARIAS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-85">
          Aplicar
        </button>
        <Link href="/admin/" className="text-sm text-muted hover:text-ink">
          Limpar
        </Link>
      </div>
    </form>
  );
}
