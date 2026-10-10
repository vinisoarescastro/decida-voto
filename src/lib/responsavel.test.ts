import { describe, expect, it } from "vitest";
import { errosDoResponsavel, responsavelSchema } from "./responsavel";

describe("responsavelSchema", () => {
  it("aceita nome e e-mail válidos, removendo espaços e padronizando o e-mail", () => {
    expect(responsavelSchema.parse({ nome: "  Maria da Silva ", email: " Contato@Exemplo.ORG " })).toEqual({
      nome: "Maria da Silva",
      email: "contato@exemplo.org",
    });
  });

  it("recusa nome curto, e-mail inválido e campos extras", () => {
    const r = responsavelSchema.safeParse({ nome: "Ma", email: "sem-arroba" });
    expect(r.success).toBe(false);
    expect(errosDoResponsavel(r.error!)).toEqual({ nome: "Informe o nome do responsável.", email: "Informe um e-mail válido." });
    expect(responsavelSchema.safeParse({ nome: "Maria", email: "a@b.org", extra: 1 }).success).toBe(false);
  });

  it("recusa textos longos demais", () => {
    expect(responsavelSchema.safeParse({ nome: "a".repeat(121), email: "a@b.org" }).success).toBe(false);
    expect(responsavelSchema.safeParse({ nome: "Maria", email: `${"a".repeat(250)}@b.org` }).success).toBe(false);
  });
});
