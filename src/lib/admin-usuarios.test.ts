import { describe, expect, it } from "vitest";
import { gerarSenhaProvisoria } from "@/server/security/crypto";
import { edicaoUsuarioSchema, novoUsuarioSchema, situacaoDe, trocaSenhaSchema } from "./admin-usuarios";

describe("cadastro de usuário", () => {
  it("normaliza usuário e e-mail (minúsculas) e aceita e-mail vazio", () => {
    const r = novoUsuarioSchema.parse({ usuario: " Maria.Silva ", nome: " Maria ", email: "", papel: "admin" });
    expect(r).toEqual({ usuario: "maria.silva", nome: "Maria", email: null, papel: "admin" });
    expect(novoUsuarioSchema.parse({ usuario: "ana", nome: "Ana", email: " Ana@Exemplo.ORG ", papel: "master" }).email).toBe("ana@exemplo.org");
  });

  it("recusa usuário com espaço, acento ou @, e-mail inválido e nível desconhecido", () => {
    for (const usuario of ["ma ria", "joão", "a@b", "ab"]) expect(novoUsuarioSchema.safeParse({ usuario, nome: "X Y", email: "", papel: "admin" }).success).toBe(false);
    expect(novoUsuarioSchema.safeParse({ usuario: "ana", nome: "Ana", email: "nao-e-email", papel: "admin" }).success).toBe(false);
    expect(edicaoUsuarioSchema.safeParse({ nome: "Ana", email: "", papel: "dono", ativo: true }).success).toBe(false);
  });
});

describe("troca de senha", () => {
  it("exige 12 caracteres, confirmação igual e senha diferente da atual", () => {
    expect(trocaSenhaSchema.safeParse({ senhaAtual: "a", novaSenha: "curta", confirmacao: "curta" }).success).toBe(false);
    expect(trocaSenhaSchema.safeParse({ senhaAtual: "a", novaSenha: "uma senha longa", confirmacao: "outra senha longa" }).success).toBe(false);
    expect(trocaSenhaSchema.safeParse({ senhaAtual: "uma senha longa", novaSenha: "uma senha longa", confirmacao: "uma senha longa" }).success).toBe(false);
    expect(trocaSenhaSchema.safeParse({ senhaAtual: "provisoria", novaSenha: "uma senha longa", confirmacao: "uma senha longa" }).success).toBe(true);
  });
});

describe("situação do acesso", () => {
  const agora = new Date("2026-10-12T12:00:00Z");
  it("distingue ativo, inativo, aguardando primeiro acesso e provisória vencida", () => {
    expect(situacaoDe({ ativo: true, senhaProvisoria: false, provisoriaExpiraEm: null }, agora)).toBe("ativo");
    expect(situacaoDe({ ativo: false, senhaProvisoria: true, provisoriaExpiraEm: null }, agora)).toBe("inativo");
    expect(situacaoDe({ ativo: true, senhaProvisoria: true, provisoriaExpiraEm: new Date("2026-10-13T00:00:00Z") }, agora)).toBe("aguardando-troca");
    expect(situacaoDe({ ativo: true, senhaProvisoria: true, provisoriaExpiraEm: new Date("2026-10-12T11:00:00Z") }, agora)).toBe("provisoria-vencida");
  });
});

describe("senha provisória", () => {
  it("tem 3 grupos de 4 caracteres sem os que se confundem e não se repete", () => {
    const senhas = new Set(Array.from({ length: 200 }, () => gerarSenhaProvisoria()));
    expect(senhas.size).toBe(200);
    for (const s of senhas) expect(s).toMatch(/^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/);
  });
});
