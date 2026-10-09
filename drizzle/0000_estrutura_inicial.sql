CREATE TYPE "public"."faixa_etaria" AS ENUM('16-17', '18-24', '25-34', '35-44', '45-59', '60+');--> statement-breakpoint
CREATE TYPE "public"."genero" AS ENUM('homem', 'mulher');--> statement-breakpoint
CREATE TABLE "admin_sessoes" (
	"token_hash" char(64) PRIMARY KEY NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"ultimo_acesso" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limites_requisicao" (
	"escopo" varchar(40) NOT NULL,
	"chave_hash" char(64) NOT NULL,
	"janela_inicio" timestamp with time zone NOT NULL,
	"contador" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "limites_requisicao_escopo_chave_hash_janela_inicio_pk" PRIMARY KEY("escopo","chave_hash","janela_inicio")
);
--> statement-breakpoint
CREATE TABLE "municipios" (
	"codigo_ibge" integer PRIMARY KEY NOT NULL,
	"nome" varchar(80) NOT NULL,
	"uf" char(2) NOT NULL,
	CONSTRAINT "municipios_codigo_uf_uq" UNIQUE("codigo_ibge","uf")
);
--> statement-breakpoint
CREATE TABLE "participacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_envio" date DEFAULT current_date NOT NULL,
	"uf" char(2) NOT NULL,
	"municipio_codigo" integer NOT NULL,
	"genero" "genero" NOT NULL,
	"faixa_etaria" "faixa_etaria" NOT NULL,
	"temas_comparaveis" smallint NOT NULL,
	"versao_perguntas" varchar(20) NOT NULL,
	"versao_posicoes" varchar(20) NOT NULL,
	CONSTRAINT "participacoes_temas_ck" CHECK ("participacoes"."temas_comparaveis" between 0 and 50)
);
--> statement-breakpoint
CREATE TABLE "respostas" (
	"participacao_id" uuid NOT NULL,
	"pergunta_id" varchar(40) NOT NULL,
	"valor" smallint NOT NULL,
	CONSTRAINT "respostas_participacao_id_pergunta_id_pk" PRIMARY KEY("participacao_id","pergunta_id"),
	CONSTRAINT "respostas_valor_ck" CHECK ("respostas"."valor" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "resultados" (
	"participacao_id" uuid NOT NULL,
	"candidato_id" varchar(40) NOT NULL,
	"pontos" numeric(7, 4) NOT NULL,
	"concordancia" numeric(7, 4) NOT NULL,
	CONSTRAINT "resultados_participacao_id_candidato_id_pk" PRIMARY KEY("participacao_id","candidato_id"),
	CONSTRAINT "resultados_pontos_ck" CHECK ("resultados"."pontos" between 0 and 100),
	CONSTRAINT "resultados_concordancia_ck" CHECK ("resultados"."concordancia" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "tokens_usados" (
	"nonce_hash" char(64) PRIMARY KEY NOT NULL,
	"expira_em" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participacoes" ADD CONSTRAINT "participacoes_municipio_uf_fk" FOREIGN KEY ("municipio_codigo","uf") REFERENCES "public"."municipios"("codigo_ibge","uf") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_participacao_id_participacoes_id_fk" FOREIGN KEY ("participacao_id") REFERENCES "public"."participacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados" ADD CONSTRAINT "resultados_participacao_id_participacoes_id_fk" FOREIGN KEY ("participacao_id") REFERENCES "public"."participacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessoes_expira_idx" ON "admin_sessoes" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "limites_janela_idx" ON "limites_requisicao" USING btree ("janela_inicio");--> statement-breakpoint
CREATE INDEX "municipios_uf_idx" ON "municipios" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "participacoes_uf_idx" ON "participacoes" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "participacoes_municipio_idx" ON "participacoes" USING btree ("municipio_codigo");--> statement-breakpoint
CREATE INDEX "participacoes_genero_idx" ON "participacoes" USING btree ("genero");--> statement-breakpoint
CREATE INDEX "participacoes_faixa_idx" ON "participacoes" USING btree ("faixa_etaria");--> statement-breakpoint
CREATE INDEX "resultados_candidato_idx" ON "resultados" USING btree ("candidato_id");