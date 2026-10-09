"use client";

import { FAIXAS_ETARIAS, GENEROS, UFS } from "@/lib/perfil";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

type Props = {
  valores: { uf?: string; municipio?: number; genero?: string; faixa?: string };
  municipiosDaUf: [number, string][];
};

const rotulo = "text-xs font-medium text-muted";

/** Filtros por GET (a URL guarda o recorte). Trocar a UF recarrega a lista de cidades. */
export function Filtros({ valores, municipiosDaUf }: Props) {
  const ativos = [valores.uf, valores.municipio, valores.genero, valores.faixa].filter(Boolean).length;
  return (
    <form method="get" action="/admin/" className="rounded-2xl border border-line bg-surface/80 p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={rotulo}>
          Estado
          <Select
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
          </Select>
        </label>
        <label className={rotulo}>
          Cidade
          <Select name="municipio" defaultValue={valores.municipio ?? ""} disabled={!valores.uf} className="mt-1.5">
            <option value="">{valores.uf ? "Todas" : "Escolha o estado"}</option>
            {municipiosDaUf.map(([codigo, nome]) => (
              <option key={codigo} value={codigo}>
                {nome}
              </option>
            ))}
          </Select>
        </label>
        <label className={rotulo}>
          Gênero
          <Select name="genero" defaultValue={valores.genero ?? ""} className="mt-1.5">
            <option value="">Todos</option>
            {GENEROS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </Select>
        </label>
        <label className={rotulo}>
          Faixa etária
          <Select name="faixa" defaultValue={valores.faixa ?? ""} className="mt-1.5">
            <option value="">Todas</option>
            {FAIXAS_ETARIAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {ativos > 0 && (
          <ButtonLink href="/admin/" variante="ghost" tamanho="sm">
            Limpar
          </ButtonLink>
        )}
        <Button type="submit" tamanho="sm">
          Aplicar
        </Button>
      </div>
    </form>
  );
}
