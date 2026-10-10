"use client";

import Link from "next/link";
import { useId, useState, type ReactNode, type RefObject } from "react";
import type { AffinityResult } from "@/lib/affinity";
import { candidates, newsItems, questions } from "@/lib/data";
import { Logo } from "@/components/layout/logo";
import { AVISO_INSTITUCIONAL } from "@/components/layout/site-footer";
import { Botao } from "@/components/ui/button";
import { IconeCalculo, IconeCheck, IconeChevronBaixo, IconeInfo, IconeJornal, IconeLista, IconeRefazer } from "@/components/ui/icon";
import { Cartao } from "@/components/ui/text";
import type { StatusEnvio } from "@/features/quiz/api";
import { GraficoAfinidade } from "./affinity-chart";
import { ComoCalculamos } from "./how-calculated";
import { PainelNoticias } from "./news-panel";
import { PainelTemas } from "./themes-panel";

const MENSAGENS_ENVIO: Record<StatusEnvio, string | null> = {
  enviando: null,
  ok: "Sua participação foi registrada, sem identificação pessoal.",
  repetido: "Este dispositivo já participou recentemente. Esta resposta não entrou nas estatísticas.",
  limite: "Muitas participações a partir desta rede. Esta resposta não entrou nas estatísticas.",
  erro: "Não foi possível registrar sua participação agora. Seu resultado continua válido.",
};

type IdSecao = "temas" | "calculo" | "noticias";

/** Frase-resumo em linguagem simples. Não recomenda voto: descreve a proximidade das respostas. */
function resumo(resultado: AffinityResult): string {
  if (resultado.comparableCount === 0) return "Ainda não há dados suficientes para comparar.";
  if (resultado.similar) return "Suas respostas ficaram equilibradas entre os dois candidatos.";
  const lider = resultado.scores.reduce((a, b) => (b.share > a.share ? b : a));
  return `Suas respostas ficaram mais próximas das posições de ${candidates.find((c) => c.id === lider.candidateId)!.name}.`;
}

function Secao({
  id,
  icone,
  titulo,
  descricao,
  aberta,
  aoAlternar,
  children,
}: {
  id: string;
  icone: ReactNode;
  titulo: string;
  descricao: string;
  aberta: boolean;
  aoAlternar: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={id}
        onClick={aoAlternar}
        className="flex min-h-16 w-full items-center gap-4 py-3 text-left transition-colors hover:text-ink"
      >
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink">
          {icone}
        </span>
        <span className="flex-1">
          <span className="block font-medium">{titulo}</span>
          <span className="block text-sm text-muted">{descricao}</span>
        </span>
        <IconeChevronBaixo className={`shrink-0 text-muted transition-transform duration-200 ${aberta ? "rotate-180" : ""}`} />
      </button>
      {aberta && (
        <div id={id} className="animate-surgir pb-8 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

type Props = {
  resultado: AffinityResult;
  envio: StatusEnvio | null;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  aoRefazer: () => void;
  aoRevisar: () => void;
};

export function TelaResultado({ resultado, envio, tituloRef, aoRefazer, aoRevisar }: Props) {
  const base = useId();
  const [aberta, setAberta] = useState<IdSecao | null>(null);
  const alternar = (secao: IdSecao) => setAberta((atual) => (atual === secao ? null : secao));
  const semComparacao = resultado.comparableCount === 0;
  const mensagem = envio ? MENSAGENS_ENVIO[envio] : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-6 sm:px-6 sm:pt-8">
      <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Decida Voto, página inicial">
        <Logo className="h-6 sm:h-7" />
      </Link>

      <div className="animate-surgir mt-8 sm:mt-12">
        <h1 ref={tituloRef} tabIndex={-1} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Seu resultado
        </h1>
        <p className="mt-3 text-[1.625rem] font-semibold leading-tight tracking-tight text-balance sm:text-[2rem]">{resumo(resultado)}</p>

        {!semComparacao && (
          <>
            <Cartao className="mt-7 p-5 sm:p-8">
              <GraficoAfinidade placar={resultado.scores} />
              {resultado.similar && (
                <p className="mt-6 flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
                  <IconeInfo className="mt-0.5 shrink-0 text-muted" />A diferença é pequena e está dentro da imprecisão do método.
                </p>
              )}
            </Cartao>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Baseado em {resultado.comparableCount} de {questions.length} temas. Em cada tema, 100 pontos são divididos entre os
              dois candidatos: quem está mais perto da sua resposta leva mais. Estimativa informativa: não é pesquisa eleitoral
              nem recomendação de voto.
            </p>
          </>
        )}

        <p role="status" className="mt-4 flex min-h-5 items-start gap-2 text-sm text-muted">
          {mensagem && (
            <>
              {envio === "ok" ? <IconeCheck className="mt-0.5 shrink-0 text-ink" /> : <IconeInfo className="mt-0.5 shrink-0" />}
              {mensagem}
            </>
          )}
        </p>
      </div>

      <section aria-labelledby={`${base}-entenda`} className="mt-10">
        <h2 id={`${base}-entenda`} className="text-lg font-semibold tracking-tight">
          Entenda seu resultado
        </h2>
        <div className="mt-2 divide-y divide-line border-y border-line">
          <Secao
            id={`${base}-temas`}
            icone={<IconeLista />}
            titulo="Detalhes por tema"
            descricao="Sua resposta e a posição de cada candidato"
            aberta={aberta === "temas"}
            aoAlternar={() => alternar("temas")}
          >
            <PainelTemas resultado={resultado} />
          </Secao>
          <Secao
            id={`${base}-calculo`}
            icone={<IconeCalculo />}
            titulo="Como calculamos"
            descricao="O passo a passo, com os seus números"
            aberta={aberta === "calculo"}
            aoAlternar={() => alternar("calculo")}
          >
            <ComoCalculamos resultado={resultado} />
          </Secao>
          <Secao
            id={`${base}-noticias`}
            icone={<IconeJornal />}
            titulo="Notícias"
            descricao="Para se informar sobre cada tema"
            aberta={aberta === "noticias"}
            aoAlternar={() => alternar("noticias")}
          >
            <PainelNoticias itens={newsItems} />
          </Secao>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Botao onClick={aoRefazer} className="w-full sm:w-auto">
          <IconeRefazer />
          Refazer questionário
        </Botao>
        <Botao variante="secundario" onClick={aoRevisar} className="w-full sm:w-auto">
          Revisar respostas
        </Botao>
      </div>

      <footer className="pb-seguro mt-16 text-xs leading-relaxed text-muted">
        <nav aria-label="Mais informações" className="mb-1 flex flex-wrap gap-x-5">
          <Link href="/metodologia/" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline">
            Metodologia e fontes
          </Link>
          <Link href="/privacidade/" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline">
            Privacidade
          </Link>
        </nav>
        <p>{AVISO_INSTITUCIONAL}</p>
      </footer>
    </div>
  );
}
