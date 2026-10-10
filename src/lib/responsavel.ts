import { z } from "zod";

// Responsável pelo tratamento dos dados (controlador, LGPD). É exibido em Privacidade e Metodologia
// e editado no painel administrativo. Validação usada no navegador (resposta imediata) e no servidor.

export const responsavelSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome do responsável.").max(120, "Use no máximo 120 caracteres."),
    email: z.string().trim().toLowerCase().max(254, "E-mail longo demais.").email("Informe um e-mail válido."),
  })
  .strict();

export type Responsavel = z.infer<typeof responsavelSchema>;

export const RESPONSAVEL_VAZIO: Responsavel = { nome: "", email: "" };

/** Mensagens de erro por campo (a primeira de cada um). */
export function errosDoResponsavel(erro: z.ZodError): Partial<Record<keyof Responsavel, string>> {
  const erros: Partial<Record<keyof Responsavel, string>> = {};
  for (const issue of erro.issues) {
    const campo = issue.path[0];
    if ((campo === "nome" || campo === "email") && !erros[campo]) erros[campo] = issue.message;
  }
  return erros;
}
