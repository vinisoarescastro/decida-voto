import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarDbDeTeste, limpar } from "../test/db";
import { lerResponsavel, salvarResponsavel } from "./responsavel";

const { db, fechar } = criarDbDeTeste();

beforeAll(() => limpar(db));
afterAll(async () => {
  await limpar(db);
  await fechar();
});

describe("responsável pelos dados", () => {
  it("volta vazio enquanto não for configurado", async () => {
    expect(await lerResponsavel(db)).toEqual({ nome: "", email: "" });
  });

  it("grava e substitui nome e e-mail", async () => {
    await salvarResponsavel(db, { nome: "Pessoa de Teste", email: "teste@example.org" });
    expect(await lerResponsavel(db)).toEqual({ nome: "Pessoa de Teste", email: "teste@example.org" });

    await salvarResponsavel(db, { nome: "Outra Pessoa", email: "outra@example.org" });
    expect(await lerResponsavel(db)).toEqual({ nome: "Outra Pessoa", email: "outra@example.org" });
  });
});
