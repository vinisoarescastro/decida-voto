import type { ReactNode } from "react";

/** Contêiner das páginas de conteúdo (Metodologia, Privacidade): coluna de leitura confortável. */
export function PaginaConteudo({ titulo, intro, children }: { titulo: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <article className="animate-surgir mx-auto max-w-2xl px-5 pt-10 sm:px-6 sm:pt-16">
      <header className="space-y-4">
        <h1 className="text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">{titulo}</h1>
        {intro}
      </header>
      <div className="mt-12 space-y-14">{children}</div>
    </article>
  );
}

/** Seção de uma página de conteúdo. O id serve de âncora para o sumário. */
export function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-xl font-semibold tracking-tight">
        {titulo}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted [&_strong]:text-ink">{children}</div>
    </section>
  );
}
