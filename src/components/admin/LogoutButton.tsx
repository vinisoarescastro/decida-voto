"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function sair() {
    await fetch("/api/admin/logout/", { method: "POST" }).catch(() => {});
    router.replace("/admin/login/");
    router.refresh();
  }
  return (
    <button type="button" onClick={sair} className="text-sm text-muted transition-colors hover:text-ink">
      Sair
    </button>
  );
}
