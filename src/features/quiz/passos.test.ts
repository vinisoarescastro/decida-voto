import { describe, expect, it } from "vitest";
import { questions } from "@/lib/data";
import { ordemDoPasso, passoParaUrl, resolverPasso } from "./passos";

const todas = Object.fromEntries(questions.map((q) => [q.id, "a"]));
const ate = (n: number) => Object.fromEntries(questions.slice(0, n).map((q) => [q.id, "a"]));

describe("resolverPasso", () => {
  it("sem token, qualquer endereço leva ao perfil", () => {
    expect(resolverPasso("5", false, questions, todas)).toEqual({ tipo: "perfil" });
    expect(resolverPasso("resultado", false, questions, todas)).toEqual({ tipo: "perfil" });
  });

  it("não permite pular perguntas sem resposta", () => {
    expect(resolverPasso("7", true, questions, ate(2))).toEqual({ tipo: "pergunta", indice: 2 });
    expect(resolverPasso("3", true, questions, ate(2))).toEqual({ tipo: "pergunta", indice: 2 });
    expect(resolverPasso("2", true, questions, ate(2))).toEqual({ tipo: "pergunta", indice: 1 });
  });

  it("só mostra o resultado com todas as respostas", () => {
    expect(resolverPasso("resultado", true, questions, ate(9))).toEqual({ tipo: "pergunta", indice: 9 });
    expect(resolverPasso("resultado", true, questions, todas)).toEqual({ tipo: "resultado" });
  });

  it("valores inválidos voltam ao perfil", () => {
    for (const v of [null, "0", "11", "abc", "2.5"]) expect(resolverPasso(v, true, questions, todas)).toEqual({ tipo: "perfil" });
  });
});

describe("passoParaUrl e ordemDoPasso", () => {
  it("convertem ida e volta de forma consistente", () => {
    expect(passoParaUrl({ tipo: "perfil" })).toBeNull();
    expect(passoParaUrl({ tipo: "pergunta", indice: 0 })).toBe("1");
    expect(passoParaUrl({ tipo: "resultado" })).toBe("resultado");
    expect(ordemDoPasso({ tipo: "perfil" })).toBeLessThan(ordemDoPasso({ tipo: "pergunta", indice: 0 }));
    expect(ordemDoPasso({ tipo: "pergunta", indice: 9 })).toBeLessThan(ordemDoPasso({ tipo: "resultado" }));
  });
});
