import { Logo } from "@/components/layout/logo";
import { BotaoLink } from "@/components/ui/button";
import { Sobretitulo } from "@/components/ui/text";
import { candidates, questions } from "@/lib/data";

export default function Inicio() {
  const nomes = candidates.map((c) => c.name).join(" e ");
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 pt-14 text-center sm:px-6 sm:pt-20">
      <div className="animate-surgir">
        <Logo className="h-24 sm:h-32" alt="Em quem votar?" />
      </div>
      <Sobretitulo className="animate-surgir mt-12 [animation-delay:60ms]">
        2º turno presidencial · <span className="whitespace-nowrap">25 de outubro de 2026</span>
      </Sobretitulo>
      <h1 className="animate-surgir mt-4 text-[2.125rem] font-semibold leading-[1.08] tracking-tight text-balance [animation-delay:100ms] sm:text-5xl">
        Compare suas opiniões com as posições dos candidatos.
      </h1>
      <p className="animate-surgir mt-5 text-[1.0625rem] leading-relaxed text-muted text-pretty [animation-delay:140ms] sm:text-lg">
        Responda {questions.length} perguntas e veja sua afinidade com {nomes}, com base em posições públicas documentadas.
        A decisão continua sendo sua.
      </p>
      <div className="animate-surgir mt-10 w-full [animation-delay:180ms] sm:w-auto">
        <BotaoLink href="/questionario/" tamanho="lg" className="w-full sm:w-auto">
          Começar questionário
        </BotaoLink>
      </div>
      <p className="animate-surgir mt-4 text-sm text-muted [animation-delay:220ms]">Somente 3 minutos, sem cadastro.</p>
    </section>
  );
}
