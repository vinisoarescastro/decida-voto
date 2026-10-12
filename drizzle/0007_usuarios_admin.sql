CREATE TYPE "public"."papel_admin" AS ENUM('master', 'admin');--> statement-breakpoint
CREATE TABLE "admin_auditoria" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_auditoria_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"quando" timestamp with time zone DEFAULT now() NOT NULL,
	"usuario_id" uuid,
	"usuario" varchar(40) NOT NULL,
	"acao" varchar(40) NOT NULL,
	"detalhe" varchar(200) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario" varchar(40) NOT NULL,
	"nome" varchar(80) NOT NULL,
	"email" varchar(254),
	"papel" "papel_admin" DEFAULT 'admin' NOT NULL,
	"senha_hash" varchar(300) NOT NULL,
	"senha_provisoria" boolean DEFAULT false NOT NULL,
	"provisoria_expira_em" timestamp with time zone,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_acesso_em" timestamp with time zone,
	CONSTRAINT "admin_usuarios_usuario_uk" UNIQUE("usuario"),
	CONSTRAINT "admin_usuarios_email_uk" UNIQUE("email")
);
--> statement-breakpoint
-- As sessões abertas antes dos usuários nominais não têm dono: são encerradas (todos entram de novo).
DELETE FROM "admin_sessoes";--> statement-breakpoint
ALTER TABLE "admin_sessoes" ADD COLUMN "usuario_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_auditoria" ADD CONSTRAINT "admin_auditoria_usuario_id_admin_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."admin_usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_auditoria_quando_idx" ON "admin_auditoria" USING btree ("quando");--> statement-breakpoint
CREATE INDEX "admin_auditoria_usuario_idx" ON "admin_auditoria" USING btree ("usuario_id","quando");--> statement-breakpoint
ALTER TABLE "admin_sessoes" ADD CONSTRAINT "admin_sessoes_usuario_id_admin_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."admin_usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessoes_usuario_idx" ON "admin_sessoes" USING btree ("usuario_id");