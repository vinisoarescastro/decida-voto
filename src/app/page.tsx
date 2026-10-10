import Image from "next/image";
import { Fragment } from "react";
import { Logo } from "@/components/layout/logo";
import { BotaoLink } from "@/components/ui/button";
import { candidates, questions } from "@/lib/data";

export default function Inicio() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 pt-14 text-center baixa:pt-8 muito-baixa:pt-4 sm:px-6 sm:pt-20 sm:baixa:pt-8 sm:muito-baixa:pt-4">
      <div className="animate-surgir">
        <Logo className="h-24 baixa:h-20 muito-baixa:h-16 sm:h-32 sm:baixa:h-24 sm:muito-baixa:h-20" alt="Em quem votar?" />
      </div>
      {/* Pílula neutra de "evento atual": sem cores de campanha (ver identidade visual em globals.css). */}
      <p className="animate-surgir mt-10 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink shadow-sm [animation-delay:60ms] baixa:mt-6 muito-baixa:mt-4">
        <span aria-hidden="true" className="animate-pulsar size-1.5 rounded-full bg-ink" />
        2º turno · <span className="whitespace-nowrap">25 de outubro de 2026</span>
      </p>
      <h1 className="animate-surgir mt-5 text-[2.125rem] font-semibold leading-[1.08] tracking-tight text-balance [animation-delay:100ms] muito-baixa:mt-3 muito-baixa:text-[1.75rem] sm:text-5xl sm:baixa:text-[2.75rem] sm:muito-baixa:text-4xl">
        Descubra qual candidato pensa mais parecido com você.
      </h1>
      <p className="animate-surgir mt-5 text-[1.0625rem] leading-relaxed text-muted text-pretty [animation-delay:140ms] muito-baixa:mt-3 muito-baixa:text-base sm:text-lg sm:muito-baixa:text-base">
        Responda {questions.length} perguntas rápidas e veja o seu nível de afinidade com{" "}
        {candidates.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && " e "}
            {/* Foto e nome não se separam na quebra de linha. Mesmo tamanho e tratamento para os dois. */}
            <span className="whitespace-nowrap">
              <Image
                src={`/candidatos/${c.id}.jpg`}
                alt=""
                width={192}
                height={192}
                className="mr-1 inline-block size-[1.15em] rounded-full object-cover align-[-0.2em] ring-1 ring-line-strong"
              />
              {c.name}
            </span>
          </Fragment>
        ))}
        . Usamos apenas posições públicas documentadas. <strong className="font-semibold text-ink">A decisão final é sempre sua.</strong>
      </p>
      <div className="animate-surgir mt-12 w-full baixa:mt-8 muito-baixa:mt-6 [animation-delay:180ms] sm:w-auto">
        <BotaoLink href="/questionario/" tamanho="lg" className="w-full sm:w-auto">
          Descobrir minha afinidade
        </BotaoLink>
      </div>
      <p className="animate-surgir mt-4 text-sm text-muted muito-baixa:mt-3 [animation-delay:220ms]">Somente 3 minutos, sem cadastro.</p>
    </section>
  );
}
