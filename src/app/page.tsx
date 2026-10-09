import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { candidates, questions } from "@/lib/data";

export default function Home() {
  const names = candidates.map((c) => c.name).join(" e ");
  return (
    <section className="mx-auto flex min-h-[80dvh] max-w-2xl flex-col items-center justify-center px-6 pt-16 text-center">
      <div className="animate-surgir">
        <Logo className="h-10 sm:h-12" alt="Decida Voto" />
      </div>
      <p className="animate-surgir mt-12 text-xs font-medium uppercase tracking-[0.14em] text-accent [animation-delay:60ms]">
        2º turno presidencial · 25 de outubro de 2026
      </p>
      <h1 className="animate-surgir mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-balance [animation-delay:100ms] sm:text-5xl">
        Compare suas opiniões com as posições dos candidatos.
      </h1>
      <p className="animate-surgir mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty [animation-delay:140ms]">
        Responda {questions.length} perguntas e veja sua afinidade com {names}, com base em posições públicas
        documentadas. A decisão continua sendo sua.
      </p>
      <div className="animate-surgir mt-10 [animation-delay:180ms]">
        <ButtonLink href="/questionario/" tamanho="lg">
          Começar questionário
        </ButtonLink>
      </div>
      <p className="animate-surgir mt-5 text-sm text-muted [animation-delay:220ms]">Somente 3 minutos, sem cadastro.</p>
    </section>
  );
}
