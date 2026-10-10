CREATE TABLE "revisao_perguntas" (
	"pergunta_id" varchar(40) PRIMARY KEY NOT NULL,
	"dados" jsonb NOT NULL,
	"revisada" boolean DEFAULT false NOT NULL,
	"nota" varchar(2000) DEFAULT '' NOT NULL,
	"versao_perguntas" varchar(20) NOT NULL,
	"versao_posicoes" varchar(20) NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
