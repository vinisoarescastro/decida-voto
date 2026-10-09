import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <div className="animate-surgir mx-auto max-w-sm rounded-3xl border border-line bg-surface/90 p-8 shadow-card sm:mt-6">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">Área administrativa</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acesso restrito</h1>
      <p className="mt-2 text-sm text-muted">Painel com estatísticas agregadas do Decida Voto.</p>
      <LoginForm />
    </div>
  );
}
