import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db/client";
import { COOKIE_ADMIN, validarSessao } from "./services/sessoes";

/** Garante sessão administrativa válida; caso contrário, redireciona para o login. */
export async function exigirAdmin(): Promise<void> {
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!(await validarSessao(db(), token))) redirect("/admin/login/");
}
