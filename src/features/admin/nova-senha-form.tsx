"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/button";
import { Alerta, Campo, ErroCampo, classeRotulo } from "@/components/ui/field";
import { Girando, IconeCheck } from "@/components/ui/icon";
import { errosPorCampo, SENHA_MINIMA, trocaSenhaSchema } from "@/lib/admin-usuarios";

type Campos = { senhaAtual: string; novaSenha: string; confirmacao: string };

/** Troca da própria senha. Com senha provisória, é obrigatória antes de usar o painel. */
export function FormularioNovaSenha({ provisoria }: { provisoria: boolean }) {
  const router = useRouter();
  const id = useId();
  const [valores, setValores] = useState<Campos>({ senhaAtual: "", novaSenha: "", confirmacao: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  function mudar(campo: keyof Campos, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: "" }));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);
    const v = trocaSenhaSchema.safeParse(valores);
    if (!v.success) return setErros(errosPorCampo(v.error));
    setEnviando(true);
    try {
      const r = await fetch("/api/admin/senha/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v.data) });
      if (r.status === 401) return router.replace("/admin/login/");
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErros(corpo.campos ?? {});
        setErroGeral(corpo.erro ?? "Não foi possível trocar a senha.");
        return;
      }
      setPronto(true);
      setValores({ senhaAtual: "", novaSenha: "", confirmacao: "" });
      router.refresh();
    } catch {
      setErroGeral("Não foi possível trocar a senha. Verifique sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div className="mt-8 space-y-5">
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
          <IconeCheck tamanho={18} className="mt-0.5 shrink-0" />
          Senha alterada. As outras sessões abertas com a sua conta foram encerradas.
        </p>
        <Botao tamanho="lg" className="w-full" onClick={() => router.replace("/admin/")}>
          Ir para o painel
        </Botao>
      </div>
    );
  }

  const campo = (nome: keyof Campos, rotulo: string, autoComplete: string, dica?: string) => (
    <div>
      <label htmlFor={`${id}-${nome}`} className={classeRotulo}>
        {rotulo}
      </label>
      {dica && (
        <p id={`${id}-${nome}-dica`} className="mt-1 text-sm text-muted">
          {dica}
        </p>
      )}
      <Campo
        id={`${id}-${nome}`}
        type="password"
        autoComplete={autoComplete}
        required
        maxLength={200}
        value={valores[nome]}
        onChange={(e) => mudar(nome, e.target.value)}
        aria-invalid={Boolean(erros[nome])}
        aria-describedby={[dica && `${id}-${nome}-dica`, erros[nome] && `${id}-${nome}-erro`].filter(Boolean).join(" ") || undefined}
        className="mt-2"
      />
      <ErroCampo id={`${id}-${nome}-erro`} texto={erros[nome]} />
    </div>
  );

  return (
    <form onSubmit={salvar} noValidate className="mt-8 space-y-5">
      {campo("senhaAtual", provisoria ? "Senha provisória" : "Senha atual", "current-password")}
      {campo("novaSenha", "Nova senha", "new-password", `Pelo menos ${SENHA_MINIMA} caracteres. Uma frase com algumas palavras é fácil de lembrar e difícil de adivinhar.`)}
      {campo("confirmacao", "Repita a nova senha", "new-password")}
      {erroGeral && <Alerta>{erroGeral}</Alerta>}
      <Botao type="submit" disabled={enviando} tamanho="lg" className="w-full">
        {enviando && <Girando />}
        {enviando ? "Salvando" : "Salvar nova senha"}
      </Botao>
    </form>
  );
}
