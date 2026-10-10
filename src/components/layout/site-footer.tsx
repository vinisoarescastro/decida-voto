"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/metodologia/", label: "Metodologia e fontes" },
  { href: "/privacidade/", label: "Privacidade" },
];

export const AVISO_INSTITUCIONAL =
  "Ferramenta informativa e independente, sem vínculo com candidatos, partidos ou a Justiça Eleitoral. Não é pesquisa eleitoral nem recomendação de voto.";

/** Rodapé com o aviso institucional. Oculto no questionário (modo foco) e no painel. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/questionario") || pathname.startsWith("/admin")) return null;
  const inicio = pathname === "/";
  return (
    <footer className={`mx-auto w-full max-w-2xl px-5 pb-8 pt-20 text-xs leading-relaxed text-muted sm:px-6 ${inicio ? "text-center" : ""}`}>
      {!inicio && (
        <nav aria-label="Rodapé" className="mb-1 flex flex-wrap gap-x-5">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
      <p className="pb-seguro">{AVISO_INSTITUCIONAL}</p>
    </footer>
  );
}
