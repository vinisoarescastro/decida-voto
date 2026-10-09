import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="animate-surgir mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-6 pt-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">Erro 404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Página não encontrada</h1>
      <p className="mt-4 text-muted">O endereço pode estar incorreto ou a página pode ter mudado de lugar.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Ir para o início</ButtonLink>
        <ButtonLink href="/questionario/" variante="secondary">
          Fazer o questionário
        </ButtonLink>
      </div>
    </section>
  );
}
