import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { IconeAlerta, IconeChevron } from "./Icon";

// Campos de formulário padronizados: mesma altura, borda, foco e estado de erro em toda a aplicação.
// Fonte de 16px nos campos evita o zoom automático do iOS ao tocar.

export const classeCampo =
  "h-12 w-full rounded-xl border border-line-strong bg-surface/90 px-4 text-base text-ink shadow-sm " +
  "transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 " +
  "hover:border-ink/25 focus:border-accent focus:outline-none focus:ring-4 focus:ring-ring " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export const classeRotulo = "block text-sm font-medium text-ink";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${classeCampo} ${props.className ?? ""}`} />;
}

export function Select({ children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`${classeCampo} cursor-pointer appearance-none pr-11`}>
        {children}
      </select>
      <IconeChevron tamanho={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Mensagem de erro de campo, ligada ao campo por aria-describedby. */
export function MensagemErro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="animate-surgir mt-2 flex items-start gap-1.5 text-sm text-danger">
      <IconeAlerta tamanho={16} className="mt-0.5 shrink-0" />
      {texto}
    </p>
  );
}
