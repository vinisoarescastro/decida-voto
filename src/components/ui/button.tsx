import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

// Botão padrão. Variantes:
// - primario: a ação principal da tela (uma por tela)
// - secundario: ação alternativa, com contorno
// - discreto: ação de menor peso, sem contorno, com área de toque confortável

type Variante = "primario" | "secundario" | "discreto";
type Tamanho = "sm" | "md" | "lg";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap " +
  "transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 ease-out " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-ink text-bg shadow-sm hover:bg-ink-hover",
  secundario: "border border-line-strong bg-surface/80 text-ink hover:border-ink/40 hover:bg-surface-2",
  discreto: "text-muted hover:bg-surface-2 hover:text-ink",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export function classeBotao(variante: Variante = "primario", tamanho: Tamanho = "md", extra = "") {
  return `${BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${extra}`;
}

type Estilo = { variante?: Variante; tamanho?: Tamanho };

export function Botao({ variante, tamanho, className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & Estilo) {
  return <button type={type} className={classeBotao(variante, tamanho, className)} {...props} />;
}

export function BotaoLink({ variante, tamanho, className = "", ...props }: ComponentProps<typeof Link> & Estilo) {
  return <Link className={classeBotao(variante, tamanho, className)} {...props} />;
}
