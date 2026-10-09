import "server-only";
import { z } from "zod";

// Configuração do servidor, lida das variáveis de ambiente (arquivo .env, nunca versionado).
// Falha cedo e com mensagem clara se algo obrigatório estiver ausente ou fraco.

const secret = z.string().min(32, "deve ter pelo menos 32 caracteres aleatórios");

const schema = z.object({
  DATABASE_URL: z.string().url(),
  /** Origem pública do site (ex.: https://decidavoto.com.br). Requisições POST de outra origem são recusadas. */
  APP_ORIGIN: z.string().url(),
  /** Assina os tokens de início do questionário. */
  FORM_TOKEN_SECRET: secret,
  /** Base do hash diário de IPs usado só no controle de abuso. */
  RATE_LIMIT_SECRET: secret,
  ADMIN_USERNAME: z.string().min(3),
  /** Gerado com `npm run admin:hash`. Nunca guarde a senha em texto puro. */
  ADMIN_PASSWORD_HASH: z.string().startsWith("scrypt:"),
  /** Tempo mínimo (s) entre iniciar o questionário e enviar; envios mais rápidos são tratados como robôs. */
  FORM_MIN_SECONDS: z.coerce.number().int().min(1).default(15),
  /** Grupos com menos participações que isso não são exibidos no painel. */
  PRIVACY_MIN_GROUP: z.coerce.number().int().min(5).default(10),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detalhes = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuração inválida no .env — ${detalhes}`);
  }
  cached = parsed.data;
  return cached;
}
