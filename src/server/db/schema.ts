import { sql } from "drizzle-orm";
import {
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Princípios: guardar só o necessário para estatísticas agregadas.
// - Nada de nome, e-mail, CPF, IP, user agent ou idade exata.
// - A data de envio é guardada sem horário, para não permitir cruzamento com logs de acesso.

export const generoEnum = pgEnum("genero", ["homem", "mulher"]);
export const faixaEtariaEnum = pgEnum("faixa_etaria", ["16-17", "18-24", "25-34", "35-44", "45-59", "60+"]);

/** Lista oficial de municípios do IBGE (carregada por migração). */
export const municipios = pgTable(
  "municipios",
  {
    codigoIbge: integer("codigo_ibge").primaryKey(),
    nome: varchar("nome", { length: 80 }).notNull(),
    uf: char("uf", { length: 2 }).notNull(),
  },
  (t) => [index("municipios_uf_idx").on(t.uf), unique("municipios_codigo_uf_uq").on(t.codigoIbge, t.uf)],
);

export const participacoes = pgTable(
  "participacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dataEnvio: date("data_envio").notNull().default(sql`current_date`),
    uf: char("uf", { length: 2 }).notNull(),
    municipioCodigo: integer("municipio_codigo").notNull(),
    genero: generoEnum("genero").notNull(),
    faixaEtaria: faixaEtariaEnum("faixa_etaria").notNull(),
    temasComparaveis: smallint("temas_comparaveis").notNull(),
    versaoPerguntas: varchar("versao_perguntas", { length: 20 }).notNull(),
    versaoPosicoes: varchar("versao_posicoes", { length: 20 }).notNull(),
  },
  (t) => [
    // Garante que o município pertence à UF informada.
    foreignKey({
      columns: [t.municipioCodigo, t.uf],
      foreignColumns: [municipios.codigoIbge, municipios.uf],
      name: "participacoes_municipio_uf_fk",
    }),
    check("participacoes_temas_ck", sql`${t.temasComparaveis} between 0 and 50`),
    index("participacoes_uf_idx").on(t.uf),
    index("participacoes_municipio_idx").on(t.municipioCodigo),
    index("participacoes_genero_idx").on(t.genero),
    index("participacoes_faixa_idx").on(t.faixaEtaria),
  ],
);

/** Resultado por candidato de cada participação (calculado no servidor). */
export const resultados = pgTable(
  "resultados",
  {
    participacaoId: uuid("participacao_id")
      .notNull()
      .references(() => participacoes.id, { onDelete: "cascade" }),
    candidatoId: varchar("candidato_id", { length: 40 }).notNull(),
    /** Parte dos 100 pontos (0 a 100). A soma dos candidatos de uma participação é 100. */
    pontos: numeric("pontos", { precision: 7, scale: 4 }).notNull(),
    /** Concordância absoluta (0 a 100). */
    concordancia: numeric("concordancia", { precision: 7, scale: 4 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.participacaoId, t.candidatoId] }),
    check("resultados_pontos_ck", sql`${t.pontos} between 0 and 100`),
    check("resultados_concordancia_ck", sql`${t.concordancia} between 0 and 100`),
    index("resultados_candidato_idx").on(t.candidatoId),
  ],
);

/** Alternativa escolhida em cada pergunta (valor 1 a 4 da escala), para permitir recálculo. */
export const respostas = pgTable(
  "respostas",
  {
    participacaoId: uuid("participacao_id")
      .notNull()
      .references(() => participacoes.id, { onDelete: "cascade" }),
    perguntaId: varchar("pergunta_id", { length: 40 }).notNull(),
    valor: smallint("valor").notNull(),
  },
  (t) => [primaryKey({ columns: [t.participacaoId, t.perguntaId] }), check("respostas_valor_ck", sql`${t.valor} between 1 and 4`)],
);

/** Contadores de limite de requisições. A chave é um hash de IP com segredo que muda por dia; apagado em 48 h. */
export const limitesRequisicao = pgTable(
  "limites_requisicao",
  {
    escopo: varchar("escopo", { length: 40 }).notNull(),
    chaveHash: char("chave_hash", { length: 64 }).notNull(),
    janelaInicio: timestamp("janela_inicio", { withTimezone: true }).notNull(),
    contador: integer("contador").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.escopo, t.chaveHash, t.janelaInicio] }), index("limites_janela_idx").on(t.janelaInicio)],
);

/** Tokens de questionário já usados (impede reenvio do mesmo token). Apagados após expirar. */
export const tokensUsados = pgTable("tokens_usados", {
  nonceHash: char("nonce_hash", { length: 64 }).primaryKey(),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
});

/** Sessões do painel administrativo. Guarda só o hash do token do cookie. */
export const adminSessoes = pgTable(
  "admin_sessoes",
  {
    tokenHash: char("token_hash", { length: 64 }).primaryKey(),
    criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    ultimoAcesso: timestamp("ultimo_acesso", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_sessoes_expira_idx").on(t.expiraEm)],
);
