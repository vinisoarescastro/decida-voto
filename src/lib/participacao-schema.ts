import { z } from "zod";
import { IDADE_MAXIMA, IDADE_MINIMA, UF_SIGLAS } from "./perfil";

// Validação definitiva no servidor (o navegador usa validarIdade, de perfil.ts, para respostas imediatas).

export const perfilSchema = z.object({
  uf: z.enum(UF_SIGLAS),
  municipio: z.number().int().min(1_000_000).max(9_999_999),
  genero: z.enum(["homem", "mulher"]),
  idade: z.number().int().min(IDADE_MINIMA).max(IDADE_MAXIMA),
});
export type Perfil = z.infer<typeof perfilSchema>;

/** Corpo do envio de uma participação. */
export const participacaoSchema = z
  .object({
    perfil: perfilSchema,
    /** id da pergunta → id da alternativa escolhida */
    respostas: z.record(z.string().max(40), z.string().max(4)),
    consentimento: z.literal(true),
    token: z.string().min(10).max(300),
    /** Campo-isca: invisível para pessoas; robôs costumam preenchê-lo. */
    site: z.string().max(200),
  })
  .strict();
export type ParticipacaoInput = z.infer<typeof participacaoSchema>;
