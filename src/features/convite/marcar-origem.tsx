"use client";

import { useEffect } from "react";
import { ORIGENS, type Origem } from "@/lib/site";

// Medição da divulgação: quem chega por um link com ?origem=convite|panfleto|stories fica marcado só nesta
// aba (sessionStorage, apagado ao fechar). No envio, o servidor grava apenas a origem — sem saber quem
// convidou nem guardar identificador. Nada de cookie novo nem ferramenta de análise de terceiros.

const eOrigem = (v: string | null): v is Origem => (ORIGENS as readonly string[]).includes(v ?? "");

const CHAVE = "dv_origem";

export function MarcarOrigem() {
  useEffect(() => {
    try {
      const origem = new URLSearchParams(window.location.search).get("origem");
      if (eOrigem(origem)) window.sessionStorage.setItem(CHAVE, origem);
    } catch {
      // Navegação privada ou armazenamento bloqueado: a participação conta, só sem a marca de origem.
    }
  }, []);
  return null;
}

/** Origem marcada nesta aba, para acompanhar o envio da participação. */
export function lerOrigem(): Origem | undefined {
  try {
    const origem = window.sessionStorage.getItem(CHAVE);
    return eOrigem(origem) ? origem : undefined;
  } catch {
    return undefined;
  }
}
