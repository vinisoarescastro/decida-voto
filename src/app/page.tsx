import Link from "next/link";
import { Logo } from "@/components/Logo";
import { candidates, questions } from "@/lib/data";

export default function Home() {
  const names = candidates.map((c) => c.name).join(" e ");
  return (
    <section className="mx-auto flex min-h-[80dvh] max-w-2xl flex-col items-center justify-center px-6 pt-16 text-center">
      <Logo className="h-10 sm:h-12" alt="Decida Voto" />
      <p className="mt-12 text-sm text-muted">2º turno presidencial · 25 de outubro de 2026</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Compare suas opiniões com as posições dos candidatos.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">
        Responda {questions.length} perguntas e veja sua afinidade com {names}, com base em posições públicas
        documentadas. A decisão continua sendo sua.
      </p>
      <Link
        href="/questionario/"
        className="mt-10 rounded-full bg-ink px-8 py-3.5 font-medium text-bg transition-opacity hover:opacity-85"
      >
        Começar questionário
      </Link>
      <p className="mt-5 text-sm text-muted">Somente 3 minutos, sem cadastro.</p>
    </section>
  );
}
