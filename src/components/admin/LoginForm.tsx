"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { classeRotulo, Input } from "@/components/ui/Field";
import { IconeAlerta } from "@/components/ui/Icon";

export function LoginForm() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      if (r.ok) {
        router.replace("/admin/");
        router.refresh();
        return;
      }
      const corpo = await r.json().catch(() => ({}));
      setErro(corpo.erro ?? "Não foi possível entrar.");
    } catch {
      setErro("Não foi possível entrar. Verifique sua conexão.");
    } finally {
      setSenha("");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="mt-8 space-y-5">
      <div>
        <label htmlFor="usuario" className={classeRotulo}>
          Usuário
        </label>
        <Input id="usuario" autoComplete="username" required value={usuario} onChange={(e) => setUsuario(e.target.value)} className="mt-2" />
      </div>
      <div>
        <label htmlFor="senha" className={classeRotulo}>
          Senha
        </label>
        <Input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-2"
        />
      </div>
      {erro && (
        <p role="alert" className="animate-surgir flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <IconeAlerta className="mt-0.5 shrink-0" />
          {erro}
        </p>
      )}
      <Button type="submit" disabled={enviando} tamanho="lg" className="w-full">
        {enviando && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
        {enviando ? "Entrando" : "Entrar"}
      </Button>
    </form>
  );
}
