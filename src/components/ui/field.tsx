import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { IconeAlerta, IconeChevronBaixo } from "./icon";

// Campos de formulário padronizados. Altura de 52 px (toque confortável) e fonte de 16 px
// (evita o zoom automático do iOS ao focar o campo).

export const classeCampo =
  "h-13 w-full rounded-2xl border border-line-strong bg-surface px-4 text-base text-ink shadow-sm " +
  "transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 " +
  "hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-4 focus:ring-ring " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15";

export const classeRotulo = "block text-sm font-medium text-ink";

export function Campo(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${classeCampo} ${props.className ?? ""}`} />;
}

export function Selecao({ children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`${classeCampo} cursor-pointer appearance-none pr-11`}>
        {children}
      </select>
      <IconeChevronBaixo className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Mensagem de erro de campo, ligada ao campo por aria-describedby. */
export function ErroCampo({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="animate-surgir mt-2 flex items-start gap-1.5 text-sm text-danger">
      <IconeAlerta tamanho={16} className="mt-0.5 shrink-0" />
      {texto}
    </p>
  );
}

/** Alerta de bloco (erros gerais de formulário). */
export function Alerta({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="animate-surgir flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      <IconeAlerta className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
