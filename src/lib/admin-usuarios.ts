import { z } from "zod";

// Regras dos usuários do painel, compartilhadas entre os formulários (navegador) e as rotas (servidor).

export const PAPEIS = [
  { id: "master", rotulo: "Master", descricao: "Vê e altera tudo, inclusive os usuários." },
  { id: "admin", rotulo: "Admin", descricao: "Só visualiza. Não altera nada." },
] as const;
export type Papel = (typeof PAPEIS)[number]["id"];
export const rotuloPapel = (p: Papel) => PAPEIS.find((x) => x.id === p)!.rotulo;

/** Validade da senha provisória gerada pelo master. */
export const VALIDADE_PROVISORIA_MS = 24 * 60 * 60 * 1000;
export const SENHA_MINIMA = 12;

const usuario = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,40}$/, "Use de 3 a 40 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.");
const nome = z.string().trim().min(2, "Informe o nome.").max(80, "Use no máximo 80 caracteres.");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-mail longo demais.")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "E-mail inválido.")
  .transform((v) => (v === "" ? null : v));
const papel = z.enum(["master", "admin"], { errorMap: () => ({ message: "Escolha o nível de acesso." }) });

export const novoUsuarioSchema = z.object({ usuario, nome, email, papel }).strict();
export const edicaoUsuarioSchema = z.object({ nome, email, papel, ativo: z.boolean() }).strict();
export type NovoUsuario = z.infer<typeof novoUsuarioSchema>;
export type EdicaoUsuario = z.infer<typeof edicaoUsuarioSchema>;

export const trocaSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual.").max(200),
    novaSenha: z.string().min(SENHA_MINIMA, `Use pelo menos ${SENHA_MINIMA} caracteres.`).max(200, "Use no máximo 200 caracteres."),
    confirmacao: z.string().max(200),
  })
  .strict()
  .refine((v) => v.novaSenha === v.confirmacao, { path: ["confirmacao"], message: "As senhas não conferem." })
  .refine((v) => v.novaSenha !== v.senhaAtual, { path: ["novaSenha"], message: "A nova senha precisa ser diferente da atual." });

/** Primeiro erro de cada campo, para mostrar ao lado do campo. */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const i of erro.issues) {
    const campo = String(i.path[0] ?? "geral");
    saida[campo] ??= i.message;
  }
  return saida;
}

/** Situação do acesso, para a lista de usuários. */
export type Situacao = "ativo" | "inativo" | "aguardando-troca" | "provisoria-vencida";
export function situacaoDe(u: { ativo: boolean; senhaProvisoria: boolean; provisoriaExpiraEm: Date | string | null }, agora = new Date()): Situacao {
  if (!u.ativo) return "inativo";
  if (!u.senhaProvisoria) return "ativo";
  return u.provisoriaExpiraEm && new Date(u.provisoriaExpiraEm) <= agora ? "provisoria-vencida" : "aguardando-troca";
}
export const ROTULO_SITUACAO: Record<Situacao, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  "aguardando-troca": "Aguardando primeiro acesso",
  "provisoria-vencida": "Senha provisória vencida",
};

/** Data e hora no horário de Brasília (ex.: "12/10/2026 14:05"). */
export function dataHoraBrasilia(d: Date | string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(d));
}
