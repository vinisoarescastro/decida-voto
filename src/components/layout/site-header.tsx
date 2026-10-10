"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

/**
 * Cabeçalho mínimo (só a logomarca). Fica oculto na página inicial, que tem a marca centralizada,
 * e no questionário, que usa uma barra própria em "modo foco".
 */
export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/questionario")) return null;
  const largo = pathname.startsWith("/admin");
  return (
    <header className={`mx-auto w-full px-5 pt-6 sm:px-6 sm:pt-8 ${largo ? "max-w-5xl" : "max-w-2xl"}`}>
      <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Decida Voto, página inicial">
        <Logo className="h-6 sm:h-7" />
      </Link>
    </header>
  );
}
