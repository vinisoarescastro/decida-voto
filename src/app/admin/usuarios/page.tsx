import { AbasPainel } from "@/features/admin/abas";
import { AvisoSomenteLeitura, CabecalhoPainel } from "@/features/admin/cabecalho";
import { GestaoUsuarios } from "@/features/admin/usuarios";
import { exigirAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import { listarUsuarios } from "@/server/services/usuarios";

export default async function PaginaUsuarios() {
  const usuario = await exigirAdmin({ tela: "Usuários" });
  const usuarios = await listarUsuarios(db());
  return (
    <div className="animate-surgir space-y-6 sm:space-y-8">
      <CabecalhoPainel usuario={usuario} titulo="Usuários" descricao="Quem acessa o painel, com o nível de acesso e o último acesso de cada pessoa." />
      <AbasPainel atual="usuarios" />
      <AvisoSomenteLeitura usuario={usuario} />
      <GestaoUsuarios usuarios={usuarios} atualId={usuario.id} podeEditar={usuario.papel === "master"} />
    </div>
  );
}
