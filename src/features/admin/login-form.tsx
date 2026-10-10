"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/button";
import { Alerta, Campo, classeRotulo } from "@/components/ui/field";
import { Girando } from "@/components/ui/icon";

export function FormularioLogin() {
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
        <Campo id="usuario" autoComplete="username" autoCapitalize="none" required value={usuario} onChange={(e) => setUsuario(e.target.value)} className="mt-2" />
      </div>
      <div>
        <label htmlFor="senha" className={classeRotulo}>
          Senha
        </label>
        <Campo
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-2"
        />
      </div>
      {erro && <Alerta>{erro}</Alerta>}
      <Botao type="submit" disabled={enviando} tamanho="lg" className="w-full">
        {enviando && <Girando />}
        {enviando ? "Entrando" : "Entrar"}
      </Botao>
    </form>
  );
}
