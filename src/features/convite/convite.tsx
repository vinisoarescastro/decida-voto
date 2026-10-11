"use client";

import { useState, useSyncExternalStore, type SVGProps } from "react";
import { classeBotao } from "@/components/ui/button";
import { IconeCheck } from "@/components/ui/icon";
import { LINK_CONVITE, MENSAGEM_CONVITE } from "@/lib/site";

// Convite para outras pessoas fazerem o teste, exibido no resultado. A mensagem é neutra e NÃO inclui o
// resultado de quem envia (opinião política é dado sensível e o período é eleitoral). Botões em tons
// neutros, como o resto do site; o ícone identifica o WhatsApp sem usar a cor da marca.

const TEXTO_COMPLETO = `${MENSAGEM_CONVITE} 👉 ${LINK_CONVITE}`;
const LINK_WHATSAPP = `https://wa.me/?text=${encodeURIComponent(TEXTO_COMPLETO)}`;

const Svg = (p: SVGProps<SVGSVGElement>) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
);
const IconeWhatsApp = () => (
  <Svg>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Svg>
);
const IconeCompartilhar = () => (
  <Svg>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </Svg>
);
const IconeCopiar = () => (
  <Svg>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);

const semAssinatura = () => () => {};

type PropsConvite = {
  titulo?: string;
  texto?: string;
};

export function ConviteCompartilhar({
  titulo = "Conhece alguém em dúvida?",
  texto = "Mande o teste. Leva 3 minutos e não precisa de cadastro. Seu resultado não vai junto.",
}: PropsConvite = {}) {
  // O menu nativo de compartilhamento só existe em alguns navegadores (quase todos os celulares).
  const podeCompartilhar = useSyncExternalStore(semAssinatura, () => "share" in navigator, () => false);
  const [copiado, setCopiado] = useState(false);
  const [mostrarLink, setMostrarLink] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(LINK_CONVITE);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      setMostrarLink(true); // Sem permissão de área de transferência: mostra o link para copiar à mão.
    }
  }

  async function compartilhar() {
    try {
      await navigator.share({ title: "Em quem votar?", text: MENSAGEM_CONVITE, url: LINK_CONVITE });
    } catch {
      // Pessoa cancelou o menu, ou o navegador recusou: nada a fazer.
    }
  }

  return (
    <section aria-labelledby="convite-titulo" className="mt-8 rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
      <h2 id="convite-titulo" className="text-lg font-semibold tracking-tight">
        {titulo}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{texto}</p>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <a href={LINK_WHATSAPP} target="_blank" rel="noopener noreferrer" className={classeBotao("primario", "md", "w-full sm:w-auto")}>
          <IconeWhatsApp />
          Enviar pelo WhatsApp
          <span className="sr-only"> (abre o WhatsApp)</span>
        </a>
        <div className="flex gap-2.5">
          {podeCompartilhar && (
            <button type="button" onClick={compartilhar} className={classeBotao("secundario", "md", "flex-1 sm:flex-none")}>
              <IconeCompartilhar />
              Compartilhar
            </button>
          )}
          <button type="button" onClick={copiar} className={classeBotao("secundario", "md", "flex-1 sm:flex-none")}>
            {copiado ? <IconeCheck tamanho={18} /> : <IconeCopiar />}
            {copiado ? "Link copiado!" : "Copiar link"}
          </button>
        </div>
      </div>

      <p role="status" className="sr-only">
        {copiado ? "Link copiado para a área de transferência." : ""}
      </p>
      {mostrarLink && (
        <label className="mt-4 block text-xs text-muted">
          Copie o link:
          <input
            readOnly
            value={LINK_CONVITE}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink"
          />
        </label>
      )}
    </section>
  );
}
