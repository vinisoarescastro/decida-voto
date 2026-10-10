"use client";

import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/button";
import { IconeSair } from "@/components/ui/icon";

export function BotaoSair() {
  const router = useRouter();
  async function sair() {
    await fetch("/api/admin/logout/", { method: "POST" }).catch(() => {});
    router.replace("/admin/login/");
    router.refresh();
  }
  return (
    <Botao variante="secundario" tamanho="sm" onClick={sair}>
      <IconeSair tamanho={16} />
      Sair
    </Botao>
  );
}
