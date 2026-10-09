/** Sumário de atalhos para as seções de uma página longa. */
export function Sumario({ itens }: { itens: { id: string; rotulo: string }[] }) {
  return (
    <nav aria-label="Nesta página">
      <p className="text-xs font-medium text-muted">Nesta página</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {itens.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className="inline-flex h-8 items-center rounded-full border border-line-strong bg-surface/80 px-3 text-xs text-muted transition-colors hover:border-ink/30 hover:text-ink"
            >
              {i.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
