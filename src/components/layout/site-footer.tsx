"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/metodologia/", label: "Metodologia" },
  { href: "/privacidade/", label: "Privacidade" },
  { href: "/privacidade/#termos", label: "Termos de uso" },
];

export const AVISO_INSTITUCIONAL =
  "Site independente, sem ligação com candidatos, partidos ou a Justiça Eleitoral. Não é pesquisa eleitoral e não indica voto.";

/** Rodapé com o aviso institucional e os links legais. Oculto no questionário (modo foco) e no painel. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/questionario") || pathname.startsWith("/admin")) return null;
  const inicio = pathname === "/";
  return (
    <footer
      className={`mx-auto w-full max-w-2xl px-5 pb-8 pt-12 text-xs leading-relaxed text-muted baixa:pt-8 muito-baixa:pb-4 muito-baixa:pt-6 sm:px-6 ${inicio ? "text-center" : ""}`}
    >
      <p>{AVISO_INSTITUCIONAL}</p>
      <nav aria-label="Rodapé" className={`pb-seguro mt-1 flex flex-wrap gap-x-5 ${inicio ? "justify-center" : ""}`}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center underline decoration-muted/40 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink">
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
