import Link from "next/link";
import type { ReactNode } from "react";
import { rotuloPapel } from "@/lib/admin-usuarios";
import { IconeInfo } from "@/components/ui/icon";
import { Sobretitulo } from "@/components/ui/text";
import type { UsuarioSessao } from "@/server/services/sessoes";
import { BotaoSair } from "./logout-button";

/** Cabeçalho das telas do painel: título, quem está logado (com o nível) e as ações da conta. */
export function CabecalhoPainel({ usuario, titulo, descricao }: { usuario: UsuarioSessao; titulo: string; descricao: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Sobretitulo>Área administrativa</Sobretitulo>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="mt-1 text-sm text-muted">{descricao}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
        <p className="min-w-0 text-sm">
          <span className="font-medium">{usuario.nome}</span>
          <span className="ml-2 inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">{rotuloPapel(usuario.papel)}</span>
        </p>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Link
            href="/admin/nova-senha/"
            className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-muted underline-offset-4 hover:bg-surface-2 hover:text-ink"
          >
            Alterar senha
          </Link>
          <BotaoSair />
        </div>
      </div>
    </header>
  );
}

/** Aviso para quem tem acesso só de visualização. */
export function AvisoSomenteLeitura({ usuario }: { usuario: UsuarioSessao }) {
  if (usuario.papel === "master") return null;
  return (
    <p role="note" className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
      <IconeInfo className="mt-0.5 shrink-0 text-ink" />
      <span>
        <strong className="font-medium text-ink">Acesso de visualização.</strong> Você pode consultar tudo, mas só um master altera
        informações.
      </span>
    </p>
  );
}
