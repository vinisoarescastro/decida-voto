"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/button";
import { Alerta, Campo, ErroCampo, classeRotulo } from "@/components/ui/field";
import { Girando, IconeCheck } from "@/components/ui/icon";
import { errosDoResponsavel, responsavelSchema, type Responsavel } from "@/lib/responsavel";

type Erros = Partial<Record<keyof Responsavel, string>>;

/** Nome e e-mail do responsável pelos dados, exibidos em Privacidade e Metodologia. */
export function FormularioResponsavel({ inicial }: { inicial: Responsavel }) {
  const router = useRouter();
  const id = useId();
  const [valores, setValores] = useState(inicial);
  const [salvos, setSalvos] = useState(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const alterado = valores.nome.trim() !== salvos.nome || valores.email.trim().toLowerCase() !== salvos.email;

  function mudar(campo: keyof Responsavel, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setSalvo(false);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);
    const validacao = responsavelSchema.safeParse(valores);
    if (!validacao.success) {
      setErros(errosDoResponsavel(validacao.error));
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch("/api/admin/responsavel/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacao.data),
      });
      if (r.status === 401) {
        router.replace("/admin/login/");
        return;
      }
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErros(corpo.campos ?? {});
        setErroGeral(corpo.erro ?? "Não foi possível salvar.");
        return;
      }
      setValores(corpo.responsavel);
      setSalvos(corpo.responsavel);
      setSalvo(true);
    } catch {
      setErroGeral("Não foi possível salvar. Verifique sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
      <h2 id={`${id}-titulo`} className="font-semibold">
        Responsável pelos dados
      </h2>
      <p className="mt-1 text-sm text-muted">
        Aparece nas páginas de Privacidade e de Metodologia como contato para dúvidas, correções e pedidos de titulares
        (LGPD). A alteração vale na hora.
      </p>

      <form onSubmit={salvar} noValidate className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-nome`} className={classeRotulo}>
              Nome do responsável
            </label>
            <Campo
              id={`${id}-nome`}
              autoComplete="name"
              maxLength={120}
              value={valores.nome}
              onChange={(e) => mudar("nome", e.target.value)}
              aria-invalid={Boolean(erros.nome)}
              aria-describedby={erros.nome ? `${id}-nome-erro` : undefined}
              className="mt-2"
            />
            <ErroCampo id={`${id}-nome-erro`} texto={erros.nome} />
          </div>
          <div>
            <label htmlFor={`${id}-email`} className={classeRotulo}>
              E-mail de contato
            </label>
            <Campo
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              value={valores.email}
              onChange={(e) => mudar("email", e.target.value)}
              aria-invalid={Boolean(erros.email)}
              aria-describedby={erros.email ? `${id}-email-erro` : undefined}
              className="mt-2"
            />
            <ErroCampo id={`${id}-email-erro`} texto={erros.email} />
          </div>
        </div>

        {erroGeral && <Alerta>{erroGeral}</Alerta>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <p role="status" className="text-sm text-muted">
            {salvo && (
              <span className="inline-flex items-center gap-1.5">
                <IconeCheck tamanho={16} className="text-ink" />
                Salvo. As páginas públicas já mostram os novos dados.
              </span>
            )}
          </p>
          <Botao type="submit" tamanho="sm" disabled={enviando || !alterado} className="sm:min-w-28">
            {enviando && <Girando />}
            {enviando ? "Salvando" : "Salvar"}
          </Botao>
        </div>
      </form>
    </section>
  );
}
