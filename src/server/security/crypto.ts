import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Funções criptográficas puras (sem acesso a banco ou ambiente), testáveis isoladamente.

export const sha256 = (valor: string) => createHash("sha256").update(valor).digest("hex");

export function iguaisEmTempoConstante(a: string, b: string): boolean {
  // Compara hashes de tamanho fixo para não vazar o tamanho nem a posição da diferença.
  return timingSafeEqual(Buffer.from(sha256(a), "hex"), Buffer.from(sha256(b), "hex"));
}

/**
 * Hash de uma chave técnica (ex.: IP) para controle de abuso.
 * Usa uma chave derivada do dia (UTC): no dia seguinte, o mesmo IP gera outro hash,
 * o que impede rastrear alguém ao longo do tempo. O IP em si nunca é gravado.
 */
export function hashDiario(segredo: string, escopo: string, valor: string, agora: Date = new Date()): string {
  const chaveDoDia = createHmac("sha256", segredo).update(agora.toISOString().slice(0, 10)).digest();
  return createHmac("sha256", chaveDoDia).update(`${escopo}:${valor}`).digest("hex");
}

// ---------------------------------------------------------------------------------------------
// Token de questionário: emitido ao iniciar, exigido no envio. Assinado (HMAC) e de uso único.

type TokenPayload = { n: string; t: number };

export function emitirToken(segredo: string, agora: number = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ n: randomBytes(16).toString("base64url"), t: agora } satisfies TokenPayload)).toString(
    "base64url",
  );
  const assinatura = createHmac("sha256", segredo).update(payload).digest("base64url");
  return `${payload}.${assinatura}`;
}

export type VerificacaoToken =
  | { ok: true; nonce: string; emitidoEm: number }
  | { ok: false; motivo: "formato" | "assinatura" | "rapido-demais" | "expirado" };

export function verificarToken(
  segredo: string,
  token: string,
  { minimoSegundos, maximoSegundos, agora = Date.now() }: { minimoSegundos: number; maximoSegundos: number; agora?: number },
): VerificacaoToken {
  const [payload, assinatura, ...resto] = token.split(".");
  if (!payload || !assinatura || resto.length) return { ok: false, motivo: "formato" };
  const esperada = createHmac("sha256", segredo).update(payload).digest("base64url");
  if (!iguaisEmTempoConstante(assinatura, esperada)) return { ok: false, motivo: "assinatura" };
  let dados: TokenPayload;
  try {
    dados = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, motivo: "formato" };
  }
  if (typeof dados.n !== "string" || typeof dados.t !== "number") return { ok: false, motivo: "formato" };
  const idade = (agora - dados.t) / 1000;
  if (idade < minimoSegundos) return { ok: false, motivo: "rapido-demais" };
  if (idade > maximoSegundos) return { ok: false, motivo: "expirado" };
  return { ok: true, nonce: dados.n, emitidoEm: dados.t };
}

// ---------------------------------------------------------------------------------------------
// Senha do administrador: scrypt (nativo do Node), parâmetros recomendados pela OWASP.

const SCRYPT = { N: 2 ** 17, r: 8, p: 1, keylen: 64 };
const MAXMEM = 256 * 1024 * 1024;

function scrypt(senha: string, sal: Buffer, keylen: number, opcoes: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(senha, sal, keylen, opcoes, (erro, chave) => (erro ? reject(erro) : resolve(chave))),
  );
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = await scrypt(senha, sal, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: MAXMEM });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, sal.toString("base64"), chave.toString("base64")].join(":");
}

export async function verificarSenha(senha: string, hashArmazenado: string): Promise<boolean> {
  const partes = hashArmazenado.split(":");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [, N, r, p, sal, chave] = partes;
  const esperado = Buffer.from(chave, "base64");
  const obtido = await scrypt(senha, Buffer.from(sal, "base64"), esperado.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  return obtido.length === esperado.length && timingSafeEqual(obtido, esperado);
}

export const novoTokenSessao = () => randomBytes(32).toString("base64url");
