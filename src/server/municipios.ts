import municipiosJson from "@/data/municipios.json";

/** Municípios do IBGE por UF: [código IBGE, nome], em ordem alfabética. */
export const municipiosPorUf = municipiosJson as unknown as Record<string, [number, string][]>;

export const nomesMunicipios = new Map<number, string>(Object.values(municipiosPorUf).flat());

export function municipioPertenceAUf(uf: string, codigo: number): boolean {
  return (municipiosPorUf[uf] ?? []).some(([c]) => c === codigo);
}
