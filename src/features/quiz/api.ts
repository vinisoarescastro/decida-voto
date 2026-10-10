import type { Answers } from "@/lib/affinity";
import type { PerfilForm } from "./profile-form";

// Comunicação do questionário com o servidor. As rotas usam a barra final (formato canônico do site),
// evitando redirecionamentos que fariam o navegador reenviar o corpo da requisição.

export type StatusEnvio = "enviando" | "ok" | "repetido" | "limite" | "erro";

export class ErroInicio extends Error {}

/** Pede o token assinado que marca o início do questionário. */
export async function iniciarQuestionario(): Promise<string> {
  let resposta: Response;
  try {
    resposta = await fetch("/api/token/", { method: "POST" });
  } catch {
    throw new ErroInicio("Sem conexão. Verifique sua internet e tente novamente.");
  }
  if (resposta.status === 429) throw new ErroInicio("Muitas tentativas a partir desta rede. Tente novamente mais tarde.");
  if (!resposta.ok) throw new ErroInicio("Não foi possível iniciar agora. Tente novamente em instantes.");
  return (await resposta.json()).token as string;
}

/** Envia perfil e respostas. O servidor recalcula a afinidade; nenhum percentual sai do navegador. */
export async function enviarParticipacao(perfil: PerfilForm, respostas: Answers, token: string): Promise<StatusEnvio> {
  try {
    const resposta = await fetch("/api/participacoes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perfil: { uf: perfil.uf, municipio: Number(perfil.municipio), genero: perfil.genero, idade: Number(perfil.idade.trim()) },
        respostas,
        // A pessoa só chega aqui depois de clicar em "Continuar", junto ao aviso de termos e privacidade.
        consentimento: true,
        token,
        site: perfil.site,
      }),
    });
    if (resposta.ok) return "ok";
    if (resposta.status === 409) return "repetido";
    if (resposta.status === 429) return "limite";
    return "erro";
  } catch {
    return "erro";
  }
}
