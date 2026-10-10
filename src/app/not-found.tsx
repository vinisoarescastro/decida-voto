import { BotaoLink } from "@/components/ui/button";
import { Sobretitulo } from "@/components/ui/text";

export default function NaoEncontrada() {
  return (
    <section className="animate-surgir mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pt-14 text-center baixa:pt-8 muito-baixa:pt-4">
      <Sobretitulo>Erro 404</Sobretitulo>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Página não encontrada</h1>
      <p className="mt-4 text-muted">O endereço pode estar incorreto ou a página pode ter mudado de lugar.</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <BotaoLink href="/">Ir para o início</BotaoLink>
        <BotaoLink href="/questionario/" variante="secundario">
          Fazer o questionário
        </BotaoLink>
      </div>
    </section>
  );
}
