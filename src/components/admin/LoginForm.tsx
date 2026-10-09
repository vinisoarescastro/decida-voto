"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const campo = "mt-2 w-full rounded-xl border border-line bg-bg/70 px-4 py-3 focus:border-accent focus:outline-none";

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
        <label htmlFor="usuario" className="text-sm font-medium">
          Usuário
        </label>
        <input id="usuario" autoComplete="username" required value={usuario} onChange={(e) => setUsuario(e.target.value)} className={campo} />
      </div>
      <div>
        <label htmlFor="senha" className="text-sm font-medium">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={campo}
        />
      </div>
      {erro && (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
