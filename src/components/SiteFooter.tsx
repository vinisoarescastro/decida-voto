"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/metodologia/", label: "Metodologia e fontes" },
  { href: "/privacidade/", label: "Privacidade" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className={`mx-auto w-full max-w-2xl px-6 pb-10 pt-24 text-xs leading-relaxed text-muted ${isHome ? "text-center" : ""}`}>
      {!isHome && (
        <nav aria-label="Rodapé" className="mb-2 flex flex-wrap gap-x-5">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-9 items-center underline-offset-4 hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
      <p>
        Ferramenta informativa e independente, sem vínculo com candidatos, partidos ou a Justiça Eleitoral. Não é pesquisa
        eleitoral nem recomendação de voto.
      </p>
    </footer>
  );
}
