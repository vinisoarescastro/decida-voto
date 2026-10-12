import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  bigint,
  jsonb,
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
    /** Data de envio no horário de Brasília (o servidor do banco roda em UTC). */
    dataEnvio: date("data_envio").notNull().default(sql`(now() at time zone 'America/Sao_Paulo')::date`),
    uf: char("uf", { length: 2 }).notNull(),
    municipioCodigo: integer("municipio_codigo").notNull(),
    genero: generoEnum("genero").notNull(),
    faixaEtaria: faixaEtariaEnum("faixa_etaria").notNull(),
    temasComparaveis: smallint("temas_comparaveis").notNull(),
    versaoPerguntas: varchar("versao_perguntas", { length: 20 }).notNull(),
    versaoPosicoes: varchar("versao_posicoes", { length: 20 }).notNull(),
    /** Como a pessoa chegou: "convite", "panfleto" ou "stories"; null nos demais casos. Não identifica ninguém. */
    origem: varchar("origem", { length: 20 }),
  },
  (t) => [
    // Garante que o município pertence à UF informada.
    foreignKey({
      columns: [t.municipioCodigo, t.uf],
      foreignColumns: [municipios.codigoIbge, municipios.uf],
      name: "participacoes_municipio_uf_fk",
    }),
    check("participacoes_temas_ck", sql`${t.temasComparaveis} between 0 and 50`),
    check("participacoes_origem_ck", sql`${t.origem} is null or ${t.origem} in ('convite', 'panfleto', 'stories')`),
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

/**
 * Configurações públicas do site editáveis pelo painel (ex.: nome e e-mail do responsável pelos dados).
 * Não guarda dados de participantes nem segredos.
 */
export const configuracoes = pgTable("configuracoes", {
  chave: varchar("chave", { length: 60 }).primaryKey(),
  valor: varchar("valor", { length: 500 }).notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Rascunhos da revisão humana de perguntas e posições, feitos no painel. Não alteram o site:
 * viram novos questions.json/positions.json na exportação, que passam pelos testes antes do build.
 */
export const revisaoPerguntas = pgTable("revisao_perguntas", {
  perguntaId: varchar("pergunta_id", { length: 40 }).primaryKey(),
  /** Texto da pergunta, alternativas e posição de cada candidato (formato de RascunhoConteudo). */
  dados: jsonb("dados").notNull(),
  revisada: boolean("revisada").notNull().default(false),
  /** Nota interna da revisão (motivo da mudança). Não aparece no site. */
  nota: varchar("nota", { length: 2000 }).notNull().default(""),
  /** Versões publicadas sobre as quais o rascunho foi feito (alerta se o conteúdo mudou depois). */
  versaoPerguntas: varchar("versao_perguntas", { length: 20 }).notNull(),
  versaoPosicoes: varchar("versao_posicoes", { length: 20 }).notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const papelAdminEnum = pgEnum("papel_admin", ["master", "admin"]);

/**
 * Pessoas com acesso ao painel. "master" altera tudo (inclusive usuários); "admin" só visualiza.
 * Usuário e e-mail são guardados em minúsculas; o e-mail é opcional e também serve para entrar.
 * A senha provisória (gerada pelo master) obriga a troca no primeiro acesso e vence em 24 horas.
 */
export const adminUsuarios = pgTable("admin_usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuario: varchar("usuario", { length: 40 }).notNull().unique("admin_usuarios_usuario_uk"),
  nome: varchar("nome", { length: 80 }).notNull(),
  email: varchar("email", { length: 254 }).unique("admin_usuarios_email_uk"),
  papel: papelAdminEnum("papel").notNull().default("admin"),
  senhaHash: varchar("senha_hash", { length: 300 }).notNull(),
  senhaProvisoria: boolean("senha_provisoria").notNull().default(false),
  provisoriaExpiraEm: timestamp("provisoria_expira_em", { withTimezone: true }),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  ultimoAcessoEm: timestamp("ultimo_acesso_em", { withTimezone: true }),
});

/**
 * Auditoria do painel: entradas, telas visualizadas e alterações. Guarda o nome de usuário da época
 * (o registro sobrevive à exclusão da pessoa) e nunca guarda senha, IP ou dados das participações.
 */
export const adminAuditoria = pgTable(
  "admin_auditoria",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    quando: timestamp("quando", { withTimezone: true }).notNull().defaultNow(),
    usuarioId: uuid("usuario_id").references(() => adminUsuarios.id, { onDelete: "set null" }),
    usuario: varchar("usuario", { length: 40 }).notNull(),
    acao: varchar("acao", { length: 40 }).notNull(),
    detalhe: varchar("detalhe", { length: 200 }).notNull().default(""),
  },
  (t) => [index("admin_auditoria_quando_idx").on(t.quando), index("admin_auditoria_usuario_idx").on(t.usuarioId, t.quando)],
);

/** Sessões do painel administrativo. Guarda só o hash do token do cookie. */
export const adminSessoes = pgTable(
  "admin_sessoes",
  {
    tokenHash: char("token_hash", { length: 64 }).primaryKey(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => adminUsuarios.id, { onDelete: "cascade" }),
    criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    ultimoAcesso: timestamp("ultimo_acesso", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_sessoes_expira_idx").on(t.expiraEm), index("admin_sessoes_usuario_idx").on(t.usuarioId)],
);
