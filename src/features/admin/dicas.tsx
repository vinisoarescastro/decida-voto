"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Dica = { texto: string; x: number; y: number };

/**
 * Camada de dicas dos gráficos e do mapa: qualquer elemento com `data-dica` mostra o texto ao passar o
 * mouse ou ao receber foco pelo teclado (linhas separadas por "\n"). As dicas só complementam: os mesmos
 * valores estão nas tabelas de cada gráfico.
 * A dica é desenhada direto no <body> (portal): dentro de um elemento animado (ex.: animate-surgir) o
 * "position: fixed" passaria a valer em relação a ele, e a dica apareceria longe do mouse.
 */
export function AreaDicas({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [dica, setDica] = useState<Dica | null>(null);
  const area = useRef<HTMLDivElement>(null);

  function mostrar(alvo: EventTarget | null, x: number, y: number) {
    const el = (alvo as Element | null)?.closest?.("[data-dica]");
    if (!el || !area.current?.contains(el)) return setDica(null);
    setDica({ texto: el.getAttribute("data-dica") ?? "", x, y });
  }

  return (
    <div
      ref={area}
      className={`relative ${className}`}
      onPointerMove={(e) => mostrar(e.target, e.clientX, e.clientY)}
      onPointerLeave={() => setDica(null)}
      onFocus={(e) => {
        const r = (e.target as Element).getBoundingClientRect();
        mostrar(e.target, r.left + r.width / 2, r.top);
      }}
      onBlur={() => setDica(null)}
    >
      {children}
      {dica &&
        createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink shadow-lg"
          style={{ left: dica.x, top: dica.y - 12 }}
        >
          {dica.texto.split("\n").map((linha, i) => (
            <p key={i} className={i === 0 ? "font-semibold" : "text-muted"}>
              {linha}
            </p>
          ))}
        </div>,
          document.body,
        )}
    </div>
  );
}
