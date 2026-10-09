import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-2xl font-semibold tracking-tight">Acesso restrito</h1>
      <p className="mt-2 text-sm text-muted">Painel com estatísticas agregadas do Decida Voto.</p>
      <LoginForm />
    </div>
  );
}
