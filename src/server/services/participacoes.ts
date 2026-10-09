import { computeAffinity } from "@/lib/affinity";
import { faixaEtaria } from "@/lib/perfil";
import type { ParticipacaoInput } from "@/lib/participacao-schema";
import type { Candidate, Position, Question } from "@/lib/schema";
import { participacoes, respostas, resultados } from "../db/schema";
import type { AnyDb } from "../db/types";
import { municipioPertenceAUf } from "../municipios";

export type BaseDeCalculo = {
  questions: Question[];
  candidates: Candidate[];
  positions: Position[];
  versaoPerguntas: string;
  versaoPosicoes: string;
};

export class DadosInvalidos extends Error {}

/**
 * Valida as respostas contra as perguntas atuais, recalcula a afinidade no servidor
 * (o navegador nunca envia percentuais) e grava tudo numa única transação.
 */
export async function registrarParticipacao(db: AnyDb, entrada: ParticipacaoInput, base: BaseDeCalculo): Promise<void> {
  const { perfil } = entrada;
  if (!municipioPertenceAUf(perfil.uf, perfil.municipio)) throw new DadosInvalidos("Município não pertence à UF.");

  const idsPerguntas = base.questions.map((q) => q.id);
  const idsRecebidos = Object.keys(entrada.respostas);
  if (idsRecebidos.length !== idsPerguntas.length || !idsPerguntas.every((id) => id in entrada.respostas)) {
    throw new DadosInvalidos("Respostas incompletas ou com perguntas desconhecidas.");
  }
  const valores = base.questions.map((q) => {
    const opcao = q.options.find((o) => o.id === entrada.respostas[q.id]);
    if (!opcao) throw new DadosInvalidos(`Alternativa inválida em ${q.id}.`);
    return { perguntaId: q.id, valor: opcao.value };
  });

  const resultado = computeAffinity(base.questions, base.candidates, base.positions, entrada.respostas);

  await db.transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(participacoes)
      .values({
        uf: perfil.uf,
        municipioCodigo: perfil.municipio,
        genero: perfil.genero,
        faixaEtaria: faixaEtaria(perfil.idade),
        temasComparaveis: resultado.comparableCount,
        versaoPerguntas: base.versaoPerguntas,
        versaoPosicoes: base.versaoPosicoes,
      })
      .returning({ id: participacoes.id });

    await tx.insert(resultados).values(
      resultado.scores.map((s) => ({
        participacaoId: id,
        candidatoId: s.candidateId,
        pontos: s.share.toFixed(4),
        concordancia: s.agreement.toFixed(4),
      })),
    );
    await tx.insert(respostas).values(valores.map((v) => ({ participacaoId: id, ...v })));
  });
}
