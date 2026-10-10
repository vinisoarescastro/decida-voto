"use client";

import { useEffect, type RefObject } from "react";
import type { Option, Question } from "@/lib/schema";
import { IconeCheck } from "@/components/ui/icon";
import { Sobretitulo } from "@/components/ui/text";

const LETRAS = ["A", "B", "C", "D"];

type Props = {
  pergunta: Question;
  /** Alternativas na ordem sorteada para esta abertura do questionário. */
  alternativas: Option[];
  escolhida: string | undefined;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  aoEscolher: (idAlternativa: string) => void;
  /** Avançar pelo teclado (Enter) quando já houver resposta. */
  aoAvancar: () => void;
  /** Classe de animação de entrada (avançando ou voltando). */
  animacao: string;
};

export function TelaPergunta({ pergunta, alternativas, escolhida, tituloRef, aoEscolher, aoAvancar, animacao }: Props) {
  // Atalhos de teclado no computador: 1–4 (ou A–D) escolhem a alternativa; Enter avança.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const alvo = e.target as HTMLElement;
      if (alvo.closest("a, button, select, textarea, input[type=text]")) return;
      const tecla = e.key.toUpperCase();
      const posicao = ["1", "2", "3", "4"].includes(tecla) ? Number(tecla) - 1 : LETRAS.indexOf(tecla);
      if (posicao >= 0 && alternativas[posicao]) {
        e.preventDefault();
        aoEscolher(alternativas[posicao].id);
      } else if (e.key === "Enter" && escolhida) {
        e.preventDefault();
        aoAvancar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [alternativas, escolhida, aoEscolher, aoAvancar]);

  return (
    <fieldset className={animacao}>
      <legend className="contents">
        <Sobretitulo>{pergunta.theme}</Sobretitulo>
        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="mt-3 text-[1.625rem] font-semibold leading-tight tracking-tight text-balance sm:text-[2rem]"
        >
          {pergunta.text}
        </h1>
      </legend>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{pergunta.context}</p>

      <div className="mt-7 space-y-3">
        {alternativas.map((alternativa, i) => {
          const marcada = escolhida === alternativa.id;
          return (
            <label
              key={alternativa.id}
              className={`group flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border bg-surface px-4 py-3.5 shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-150 active:scale-[0.99] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring ${
                marcada ? "border-ink ring-1 ring-ink" : "border-line-strong hover:border-ink/35"
              }`}
            >
              <input
                type="radio"
                name={`q-${pergunta.id}`}
                value={alternativa.id}
                checked={marcada}
                onChange={() => aoEscolher(alternativa.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors duration-150 ${
                  marcada ? "bg-ink text-bg" : "bg-surface-2 text-muted group-hover:text-ink"
                }`}
              >
                {marcada ? <IconeCheck tamanho={16} strokeWidth={3} /> : LETRAS[i]}
              </span>
              <span className={`text-[1.0625rem] leading-snug ${marcada ? "font-medium" : ""}`}>{alternativa.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
