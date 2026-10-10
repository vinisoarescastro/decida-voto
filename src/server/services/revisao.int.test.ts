import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { positionsFile, questions, questionsFile } from "@/lib/data";
import { rascunhoDoPublicado, referenciaDe } from "@/lib/revisao";
import { revisaoPerguntas } from "../db/schema";
import { criarDbDeTeste, limpar } from "../test/db";
import { descartarRascunho, lerRascunhos, salvarRascunho } from "./revisao";

const { db, fechar } = criarDbDeTeste();
const base = { questions: questionsFile, positions: positionsFile };
const versoes = { versaoPerguntas: questionsFile.version, versaoPosicoes: positionsFile.version };
const [pergunta] = questions;

beforeAll(() => limpar(db));
afterAll(async () => {
  await limpar(db);
  await fechar();
});

describe("rascunhos da revisão", () => {
  it("começa sem rascunhos", async () => {
    expect(await lerRascunhos(db)).toEqual({});
  });

  it("grava, substitui e descarta o rascunho da pergunta", async () => {
    const r = { ...rascunhoDoPublicado(referenciaDe(base, pergunta.id)!), revisada: true, nota: "Fonte conferida." };
    r.pergunta = { ...r.pergunta, text: "Texto revisado?" };
    await salvarRascunho(db, pergunta.id, r, versoes);
    let lidos = await lerRascunhos(db);
    expect(lidos[pergunta.id]).toMatchObject({ rascunho: r, ...versoes });

    await salvarRascunho(db, pergunta.id, { ...r, revisada: false }, versoes);
    lidos = await lerRascunhos(db);
    expect(Object.keys(lidos)).toEqual([pergunta.id]);
    expect(lidos[pergunta.id].rascunho.revisada).toBe(false);

    await descartarRascunho(db, pergunta.id);
    expect(await lerRascunhos(db)).toEqual({});
  });

  it("ignora registro que não passa na validação", async () => {
    await db.insert(revisaoPerguntas).values({ perguntaId: "quebrado", dados: { pergunta: {} }, ...versoes });
    expect(await lerRascunhos(db)).toEqual({});
  });
});
