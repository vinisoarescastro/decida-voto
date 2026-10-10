import "server-only";
import { connection } from "next/server";
import { RESPONSAVEL_VAZIO, type Responsavel } from "@/lib/responsavel";
import { db } from "./db/client";
import { lerResponsavel } from "./services/responsavel";

/**
 * Responsável pelos dados para as páginas públicas. Lido a cada requisição (a alteração no painel
 * aparece na hora) e nunca no build, que roda sem banco. Se o banco falhar, a página abre sem o bloco.
 */
export async function responsavelPublico(): Promise<Responsavel> {
  await connection();
  try {
    return await lerResponsavel(db());
  } catch {
    console.error("Não foi possível ler o responsável pelos dados no banco.");
    return RESPONSAVEL_VAZIO;
  }
}
