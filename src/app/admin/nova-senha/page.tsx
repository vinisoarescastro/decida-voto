import Link from "next/link";
import { Cartao, Sobretitulo } from "@/components/ui/text";
import { BotaoSair } from "@/features/admin/logout-button";
import { FormularioNovaSenha } from "@/features/admin/nova-senha-form";
import { exigirAdmin } from "@/server/auth";

export default async function PaginaNovaSenha() {
  const usuario = await exigirAdmin({ permitirProvisoria: true });
  const provisoria = usuario.senhaProvisoria;
  return (
    <Cartao className="animate-surgir mx-auto mt-4 max-w-sm p-6 sm:mt-10 sm:p-8">
      <Sobretitulo>Área administrativa</Sobretitulo>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{provisoria ? "Defina sua nova senha" : "Alterar minha senha"}</h1>
      <p className="mt-2 text-sm text-muted">
        {provisoria
          ? `Olá, ${usuario.nome}. Você entrou com uma senha provisória. Antes de usar o painel, crie a sua própria senha.`
          : `Conta: ${usuario.usuario}. Ao trocar a senha, as outras sessões abertas com a sua conta são encerradas.`}
      </p>
      <FormularioNovaSenha provisoria={provisoria} />
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
        {provisoria ? (
          <span className="text-sm text-muted">Não é você?</span>
        ) : (
          <Link href="/admin/" className="text-sm font-medium text-muted underline underline-offset-4 hover:text-ink">
            Voltar ao painel
          </Link>
        )}
        <BotaoSair />
      </div>
    </Cartao>
  );
}
