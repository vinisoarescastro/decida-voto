// Configurações públicas do site. Não coloque segredos aqui: este arquivo vai para o navegador.

// O responsável pelos dados (nome e e-mail de contato, LGPD) é configurado no painel /admin e fica no banco.
// Obrigatório antes da publicação.

/** Data em que as participações são excluídas. Mantenha igual a PARTICIPACOES_EXCLUIR_APOS no .env. */
export const RETENCAO_PARTICIPACOES = "11/10/2034";
/** Registro da última alteração do prazo, exibido na página de Privacidade (transparência com quem já participou). */
export const RETENCAO_ALTERACAO = { em: "11/10/2026", prazoAnterior: "31/03/2027" };

/** Endereço público do site (prévias de link e convites). */
export const URL_SITE = "https://emquemvotar.digital";

/**
 * Origens medidas (?origem=… no link): convite no resultado, QR code do panfleto e link dos stories.
 * Só esses valores são aceitos; a origem não identifica quem convidou nem quem respondeu.
 */
export const ORIGENS = ["convite", "panfleto", "stories"] as const;
export type Origem = (typeof ORIGENS)[number];
export const ORIGEM_CONVITE: Origem = "convite";
export const LINK_CONVITE = `${URL_SITE}/?origem=convite`;
export const LINK_PANFLETO = `${URL_SITE}/?origem=panfleto`;
export const LINK_STORIES = `${URL_SITE}/?origem=stories`;

/** Mensagem pronta do convite. Neutra e sem o resultado de quem envia (privacidade e período eleitoral). */
export const MENSAGEM_CONVITE =
  "Fiz um teste rápido que mostra qual candidato pensa mais parecido comigo. São 10 perguntas, leva 3 minutos e não precisa de cadastro. Faz o seu e depois a gente conversa!";
