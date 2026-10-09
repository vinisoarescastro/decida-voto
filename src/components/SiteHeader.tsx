"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

/** Logomarca no topo das páginas internas. Na página inicial ela aparece centralizada no próprio conteúdo. */
export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className={`mx-auto w-full px-6 pt-8 ${pathname.startsWith("/admin") ? "max-w-5xl" : "max-w-2xl"}`}>
      <Link href="/" className="inline-block" aria-label="Decida Voto, página inicial">
        <Logo />
      </Link>
    </div>
  );
}
