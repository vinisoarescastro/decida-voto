// Dados de perfil pedidos antes do questionário. Usado no navegador (validação imediata)
// e no servidor (validação definitiva). Nada aqui identifica diretamente o participante.

export const UFS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
] as const;
export const UF_SIGLAS = UFS.map((u) => u.sigla) as [string, ...string[]];
export type Uf = (typeof UFS)[number]["sigla"];

export const GENEROS = [
  { id: "homem", label: "Homem" },
  { id: "mulher", label: "Mulher" },
] as const;
export type Genero = (typeof GENEROS)[number]["id"];

export const IDADE_MINIMA = 16;
export const IDADE_MAXIMA = 120;

/** Faixas etárias usadas no armazenamento e nas estatísticas. A idade exata não é gravada. */
export const FAIXAS_ETARIAS = [
  { id: "16-17", label: "16 a 17 anos", min: 16, max: 17 },
  { id: "18-24", label: "18 a 24 anos", min: 18, max: 24 },
  { id: "25-34", label: "25 a 34 anos", min: 25, max: 34 },
  { id: "35-44", label: "35 a 44 anos", min: 35, max: 44 },
  { id: "45-59", label: "45 a 59 anos", min: 45, max: 59 },
  { id: "60+", label: "60 anos ou mais", min: 60, max: IDADE_MAXIMA },
] as const;
export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number]["id"];
export const FAIXA_IDS = FAIXAS_ETARIAS.map((f) => f.id) as [FaixaEtaria, ...FaixaEtaria[]];

export function faixaEtaria(idade: number): FaixaEtaria {
  const faixa = FAIXAS_ETARIAS.find((f) => idade >= f.min && idade <= f.max);
  if (!faixa) throw new Error(`Idade fora do intervalo: ${idade}`);
  return faixa.id;
}

/**
 * Valida a idade digitada (texto do campo). Aceita só dígitos, sem sinal, vírgula ou ponto.
 * Retorna a idade ou uma mensagem de erro amigável.
 */
export function validarIdade(texto: string): { ok: true; idade: number } | { ok: false; erro: string } {
  const valor = texto.trim();
  if (valor === "") return { ok: false, erro: "Informe sua idade." };
  if (!/^\d+$/.test(valor)) return { ok: false, erro: "Use apenas números inteiros, sem letras, vírgulas ou pontos." };
  const idade = Number(valor);
  if (idade < IDADE_MINIMA) return { ok: false, erro: `A idade mínima para participar é ${IDADE_MINIMA} anos.` };
  if (idade > IDADE_MAXIMA) return { ok: false, erro: `Informe uma idade de até ${IDADE_MAXIMA} anos.` };
  return { ok: true, idade };
}
