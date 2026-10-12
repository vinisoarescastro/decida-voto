import Link from "next/link";

const ABAS = [
  { id: "estatisticas", rotulo: "Estatísticas", href: "/admin/" },
  { id: "revisao", rotulo: "Revisão de conteúdo", href: "/admin/revisao/" },
  { id: "usuarios", rotulo: "Usuários", href: "/admin/usuarios/" },
  { id: "auditoria", rotulo: "Auditoria", href: "/admin/auditoria/" },
] as const;

/** Navegação entre as seções do painel (rola na horizontal em telas estreitas). */
export function AbasPainel({ atual }: { atual: (typeof ABAS)[number]["id"] }) {
  return (
    <nav aria-label="Seções do painel" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="inline-flex gap-1 rounded-full border border-line bg-surface-2 p-1">
        {ABAS.map((a) => (
          <li key={a.id}>
            <Link
              href={a.href}
              aria-current={a.id === atual ? "page" : undefined}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium text-muted transition-colors hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-sm"
            >
              {a.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
