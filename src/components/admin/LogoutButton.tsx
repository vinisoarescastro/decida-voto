"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconeSair } from "@/components/ui/Icon";

export function LogoutButton() {
  const router = useRouter();
  async function sair() {
    await fetch("/api/admin/logout/", { method: "POST" }).catch(() => {});
    router.replace("/admin/login/");
    router.refresh();
  }
  return (
    <Button variante="secondary" tamanho="sm" onClick={sair}>
      <IconeSair tamanho={15} />
      Sair
    </Button>
  );
}
