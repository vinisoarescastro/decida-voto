import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/server/db/client";
import { env } from "@/server/env";
import { cookieSeguro, ipDoCliente, json, lerJson, origemValida } from "@/server/http";
import { hashDiario } from "@/server/security/crypto";
import { consumir, REGRAS } from "@/server/security/rate-limit";
import { registrar } from "@/server/services/auditoria";
import { COOKIE_ADMIN, criarSessao, SESSAO_MAXIMA_MS } from "@/server/services/sessoes";
import { autenticar } from "@/server/services/usuarios";

const corpoSchema = z.object({ usuario: z.string().min(1).max(100), senha: z.string().min(1).max(200) }).strict();
const ERRO_GENERICO = "Usuário ou senha inválidos.";
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  if (!origemValida(req)) return json(403, { erro: "Origem não permitida." });

  const corpo = corpoSchema.safeParse(await lerJson(req, 2048));
  if (!corpo.success) return json(400, { erro: ERRO_GENERICO });
  const { usuario, senha } = corpo.data;

  // Limita tentativas por IP (hash diário) e por nome de usuário, antes de verificar a senha.
  const segredo = env().RATE_LIMIT_SECRET;
  const porIp = await consumir(db(), REGRAS.loginPorIp, hashDiario(segredo, REGRAS.loginPorIp.escopo, ipDoCliente(req)));
  const porUsuario = await consumir(db(), REGRAS.loginPorUsuario, hashDiario(segredo, REGRAS.loginPorUsuario.escopo, usuario.toLowerCase()));
  if (!porIp.permitido || !porUsuario.permitido) {
    const segundos = Math.max(porIp.tentarAposSegundos, porUsuario.tentarAposSegundos);
    return json(429, { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { "Retry-After": String(segundos) });
  }

  // Usuário ou e-mail. A senha é sempre verificada (mesmo com usuário errado), para o tempo de resposta não
  // revelar quem existe. A conta do .env só vale enquanto não houver nenhum usuário (vira o primeiro master).
  const r = await autenticar(db(), usuario, senha, { usuario: env().ADMIN_USERNAME, senhaHash: env().ADMIN_PASSWORD_HASH });
  if (!r.ok) {
    if (r.usuario) await registrar(db(), r.usuario, "login-falhou", r.motivo === "provisoria-vencida" ? "senha provisória vencida" : "");
    await espera(400 + Math.floor(Math.random() * 400));
    if (r.motivo === "provisoria-vencida") {
      return json(401, { erro: "Sua senha provisória venceu (vale 24 horas). Peça a um master para gerar uma nova." });
    }
    return json(401, { erro: ERRO_GENERICO });
  }

  await registrar(db(), r.usuario, "entrou");
  const token = await criarSessao(db(), r.usuario.id);
  const jar = await cookies();
  jar.set(COOKIE_ADMIN, token, {
    httpOnly: true,
    secure: cookieSeguro,
    sameSite: "strict",
    path: "/",
    maxAge: SESSAO_MAXIMA_MS / 1000,
  });
  return json(200, { ok: true });
}
