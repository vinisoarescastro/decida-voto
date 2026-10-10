import { Cartao, Sobretitulo } from "@/components/ui/text";
import { FormularioLogin } from "@/features/admin/login-form";

export default function PaginaLogin() {
  return (
    <Cartao className="animate-surgir mx-auto mt-4 max-w-sm p-6 sm:mt-10 sm:p-8">
      <Sobretitulo>Área administrativa</Sobretitulo>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acesso restrito</h1>
      <p className="mt-2 text-sm text-muted">Painel com estatísticas agregadas do Decida Voto.</p>
      <FormularioLogin />
    </Cartao>
  );
}
