"use client";

import { useEffect } from "react";
import { ORIGEM_CONVITE } from "@/lib/site";

// Medição dos convites: quem chega por um link compartilhado (?origem=convite) fica marcado só nesta aba
// (sessionStorage, apagado ao fechar). No envio, o servidor grava apenas "veio de convite" — sem saber
// quem convidou nem guardar identificador. Nada de cookie novo nem ferramenta de análise de terceiros.

const CHAVE = "dv_origem";

export function MarcarOrigem() {
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("origem") === ORIGEM_CONVITE) {
        window.sessionStorage.setItem(CHAVE, ORIGEM_CONVITE);
      }
    } catch {
      // Navegação privada ou armazenamento bloqueado: a participação conta, só sem a marca de origem.
    }
  }, []);
  return null;
}

/** Origem marcada nesta aba, para acompanhar o envio da participação. */
export function lerOrigem(): typeof ORIGEM_CONVITE | undefined {
  try {
    return window.sessionStorage.getItem(CHAVE) === ORIGEM_CONVITE ? ORIGEM_CONVITE : undefined;
  } catch {
    return undefined;
  }
}
