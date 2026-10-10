import "server-only";
import { env } from "./env";

// Utilidades comuns às rotas de API.

/** Respostas de API nunca são guardadas em cache. */
export function json(status: number, corpo: unknown, headers: HeadersInit = {}): Response {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * Aceita só requisições vindas do próprio site (proteção contra CSRF e envios de outros domínios).
 * Navegadores sempre enviam o cabeçalho Origin em POST de fetch.
 */
export function origemValida(req: Request): boolean {
  return req.headers.get("origin") === env().APP_ORIGIN;
}

/**
 * IP do cliente, informado pelo proxy no cabeçalho TRUSTED_IP_HEADER: X-Real-IP (Nginx) ou
 * CF-Connecting-IP (Cloudflare, que sobrescreve qualquer valor enviado pelo visitante). O app só
 * recebe tráfego do proxy (escuta em 127.0.0.1 ou na rede interna do Docker), então o cabeçalho
 * não pode ser forjado por quem acessa de fora. Usado apenas para gerar hashes.
 */
export function ipDoCliente(req: Request): string {
  return req.headers.get(env().TRUSTED_IP_HEADER)?.trim() || "sem-ip";
}

const LIMITE_CORPO = 16 * 1024;

/** Lê o corpo JSON com limite de tamanho. Retorna undefined se for grande demais ou inválido. */
export async function lerJson(req: Request, limite = LIMITE_CORPO): Promise<unknown | undefined> {
  const declarado = Number(req.headers.get("content-length") ?? "0");
  if (declarado > limite) return undefined;
  const texto = await req.text();
  if (texto.length > limite) return undefined;
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

export const cookieSeguro = process.env.NODE_ENV === "production";
