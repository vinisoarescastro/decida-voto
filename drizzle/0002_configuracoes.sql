CREATE TABLE "configuracoes" (
	"chave" varchar(60) PRIMARY KEY NOT NULL,
	"valor" varchar(500) NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
