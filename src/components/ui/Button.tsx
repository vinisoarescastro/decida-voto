import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

// Botão padrão da aplicação. Variantes:
// - primary: ação principal da tela (uma por tela, sempre que possível)
// - secondary: ação alternativa com contorno
// - ghost: ação discreta (texto), com área de toque confortável

type Variante = "primary" | "secondary" | "ghost";
type Tamanho = "sm" | "md" | "lg";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap " +
  "transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 ease-out " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const VARIANTES: Record<Variante, string> = {
  primary: "bg-ink text-bg shadow-sm hover:bg-ink/85 hover:shadow-md",
  secondary: "border border-line-strong bg-surface/80 text-ink hover:border-ink/30 hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

export function classeBotao(variante: Variante = "primary", tamanho: Tamanho = "md", extra = "") {
  return `${BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${extra}`;
}

type Estilo = { variante?: Variante; tamanho?: Tamanho };

export function Button({ variante, tamanho, className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & Estilo) {
  return <button type={type} className={classeBotao(variante, tamanho, className)} {...props} />;
}

export function ButtonLink({ variante, tamanho, className = "", ...props }: ComponentProps<typeof Link> & Estilo) {
  return <Link className={classeBotao(variante, tamanho, className)} {...props} />;
}
