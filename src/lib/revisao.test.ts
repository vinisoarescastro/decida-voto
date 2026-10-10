import { describe, expect, it } from "vitest";
import questionsJson from "@/data/questions.json";
import positionsJson from "@/data/positions.json";
import {
  aplicarRascunhos,
  camposAlterados,
  hojeEmBrasilia,
  proximaVersao,
  rascunhoDoPublicado,
  referenciaDe,
  serializarArquivo,
  validarArquivos,
  validarRascunho,
  type ArquivosPublicados,
  type Rascunho,
} from "./revisao";
import { positionsFileSchema, questionsFileSchema } from "./schema";

const base: ArquivosPublicados = {
  questions: questionsFileSchema.parse(questionsJson),
  positions: positionsFileSchema.parse(positionsJson),
};
const [pergunta] = base.questions.questions;
const ref = referenciaDe(base, pergunta.id)!;
const [c1, c2] = base.positions.candidates.map((c) => c.id);

function copia(): Rascunho {
  return structuredClone(rascunhoDoPublicado(ref));
}

describe("rascunho de revisão", () => {
  it("parte do conteúdo publicado e não acusa alterações", () => {
    const r = copia();
    expect(validarRascunho(ref, r)).toEqual({ ok: true, rascunho: r });
    expect(camposAlterados(rascunhoDoPublicado(ref), r).size).toBe(0);
  });

  it("aponta o campo inválido pelo caminho", () => {
    const r = copia();
    r.pergunta.text = "   ";
    r.posicoes[c1].rationale = "";
    const v = validarRascunho(ref, r);
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.erros["pergunta.text"]).toBe("Escreva a pergunta.");
      expect(v.erros[`posicoes.${c1}.rationale`]).toBe("Explique por que esta alternativa foi escolhida.");
    }
  });

  it("recusa alternativas ou candidatos que não existem na pergunta publicada", () => {
    const outraAlternativa = copia();
    outraAlternativa.pergunta.options[0].id = "z";
    expect(validarRascunho(ref, outraAlternativa).ok).toBe(false);

    const outroCandidato = copia();
    outroCandidato.posicoes["intruso"] = outroCandidato.posicoes[c1];
    expect(validarRascunho(ref, outroCandidato).ok).toBe(false);

    expect(validarRascunho(ref, { ...copia(), extra: true }).ok).toBe(false);
  });

  it("sem posição documentada descarta a confiança", () => {
    const r = copia();
    r.posicoes[c1] = { ...r.posicoes[c1], value: null };
    const v = validarRascunho(ref, r);
    expect(v.ok && v.rascunho.posicoes[c1].confidence).toBe(null);
  });

  it("destaca só os campos alterados", () => {
    const r = copia();
    r.pergunta.options[2].text = "Outro texto";
    r.posicoes[c2].value = r.posicoes[c2].value === 4 ? 3 : 4;
    r.revisada = true;
    r.nota = "Conferido";
    expect([...camposAlterados(rascunhoDoPublicado(ref), r)].sort()).toEqual(["pergunta.options.2.text", `posicoes.${c2}.value`]);
  });
});

describe("exportação", () => {
  it("sem rascunhos, gera arquivos idênticos aos publicados (byte a byte)", () => {
    const saida = aplicarRascunhos(base, {}, "2026-10-10");
    expect(serializarArquivo(saida.questions)).toBe(serializarArquivo(questionsJson));
    expect(serializarArquivo(saida.positions)).toBe(serializarArquivo(positionsJson));
    expect(validarArquivos(saida)).toEqual([]);
  });

  it("aplica a edição, sobe a versão e preserva fontes e ordem", () => {
    const r = copia();
    r.pergunta.text = "Pergunta revisada?";
    r.pergunta.options[1].text = "Alternativa revisada.";
    r.posicoes[c1] = { ...r.posicoes[c1], value: 2, confidence: "alta", summary: "Resumo novo." };
    const saida = aplicarRascunhos(base, { [pergunta.id]: r }, "2026-10-10");

    const q = saida.questions.questions[0];
    expect(q.text).toBe("Pergunta revisada?");
    expect(q.options[1]).toEqual({ ...pergunta.options[1], text: "Alternativa revisada." });
    expect(Object.keys(q)).toEqual(Object.keys(pergunta));

    const p = saida.positions.positions.find((x) => x.questionId === pergunta.id && x.candidateId === c1)!;
    expect(p).toMatchObject({ status: "documented", value: 2, confidence: "alta", summary: "Resumo novo.", evidence: ref.posicoes[c1].evidence });

    expect(saida.questions.version).toBe(proximaVersao(base.questions.version));
    expect(saida.positions.version).toBe(proximaVersao(base.positions.version));
    expect(saida.positions.updatedAt).toBe("2026-10-10");
    expect(validarArquivos(saida)).toEqual([]);
  });

  it("só marca o arquivo como revisado quando todas as perguntas estão revisadas", () => {
    const algumas = { [pergunta.id]: { ...copia(), revisada: true } };
    expect(aplicarRascunhos(base, algumas, "2026-10-10").positions.reviewStatus).toBe("pendente");

    const todas = Object.fromEntries(
      base.questions.questions.map((q) => [q.id, { ...rascunhoDoPublicado(referenciaDe(base, q.id)!), revisada: true }]),
    );
    const saida = aplicarRascunhos(base, todas, "2026-10-10");
    expect(saida.positions.reviewStatus).toBe("revisado");
    // Marcar como revisada sem mudar conteúdo não muda a versão.
    expect(saida.questions.version).toBe(base.questions.version);
    expect(saida.positions.version).toBe(base.positions.version);
  });

  it("posição sem alternativa vira 'insufficient'", () => {
    const r = copia();
    r.posicoes[c2] = { ...r.posicoes[c2], value: null, confidence: null };
    const saida = aplicarRascunhos(base, { [pergunta.id]: r }, "2026-10-10");
    const p = saida.positions.positions.find((x) => x.questionId === pergunta.id && x.candidateId === c2)!;
    expect(p).toMatchObject({ status: "insufficient", value: null, confidence: null });
    expect(validarArquivos(saida)).toEqual([]);
  });

  it("acusa arquivo inválido", () => {
    const saida = aplicarRascunhos(base, {}, "2026-10-10");
    saida.positions.positions = saida.positions.positions.slice(1);
    expect(validarArquivos(saida).length).toBeGreaterThan(0);
  });
});

describe("utilitários", () => {
  it("incrementa a versão", () => {
    expect(proximaVersao("2.6.0")).toBe("2.6.1");
    expect(proximaVersao("1.4.9")).toBe("1.4.10");
    expect(proximaVersao("v3")).toBe("v3.1");
  });

  it("usa a data de Brasília", () => {
    // 02:00 UTC de 11/10 ainda é 10/10 em Brasília (UTC−3).
    expect(hojeEmBrasilia(new Date("2026-10-11T02:00:00Z"))).toBe("2026-10-10");
  });
});
