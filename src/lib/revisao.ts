import { z } from "zod";
import { positionsFileSchema, questionsFileSchema, type Position, type PositionsFile, type Question, type QuestionsFile } from "./schema";

// Revisão humana de perguntas e posições pelo painel. As edições ficam como rascunho no banco e
// viram novos questions.json/positions.json na exportação: o site público só muda depois que os
// arquivos entram no repositório e passam pelos testes do build. Fontes (evidências) não são
// editadas aqui. Validação usada no navegador (resposta imediata) e no servidor.

const texto = (max: number, vazio: string) =>
  z.string().trim().min(1, vazio).max(max, `Use no máximo ${max} caracteres.`);

export const posicaoRascunhoSchema = z
  .object({
    /** Alternativa (valor 1 a 4 da escala) em que o candidato está; null = sem posição documentada. */
    value: z.number().int().min(1).max(4).nullable(),
    confidence: z.enum(["alta", "media"]).nullable(),
    summary: texto(1500, "Escreva o resumo da posição."),
    rationale: z.string().trim().max(3000, "Use no máximo 3000 caracteres."),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.value === null) return;
    if (p.confidence === null) ctx.addIssue({ code: "custom", path: ["confidence"], message: "Escolha a confiança." });
    if (!p.rationale) ctx.addIssue({ code: "custom", path: ["rationale"], message: "Explique por que esta alternativa foi escolhida." });
  })
  // Sem posição documentada não há confiança.
  .transform((p) => (p.value === null ? { ...p, confidence: null } : p));

export const rascunhoSchema = z
  .object({
    pergunta: z
      .object({
        theme: texto(60, "Informe o tema."),
        text: texto(200, "Escreva a pergunta."),
        context: texto(400, "Escreva o texto de apoio."),
        options: z
          .array(z.object({ id: z.string().min(1).max(10), text: texto(200, "Escreva a alternativa.") }).strict())
          .length(4),
      })
      .strict(),
    posicoes: z.record(z.string().max(40), posicaoRascunhoSchema),
    revisada: z.boolean(),
    nota: z.string().trim().max(2000, "Use no máximo 2000 caracteres."),
  })
  .strict();

export type Rascunho = z.infer<typeof rascunhoSchema>;
export type PosicaoRascunho = Rascunho["posicoes"][string];

/** Conteúdo publicado de uma pergunta: o ponto de partida e a comparação da revisão. */
export type Referencia = { pergunta: Question; posicoes: Record<string, Position> };

export type ArquivosPublicados = { questions: QuestionsFile; positions: PositionsFile };

export function referenciaDe(base: ArquivosPublicados, perguntaId: string): Referencia | null {
  const pergunta = base.questions.questions.find((q) => q.id === perguntaId);
  if (!pergunta) return null;
  const posicoes: Record<string, Position> = {};
  for (const p of base.positions.positions) if (p.questionId === perguntaId) posicoes[p.candidateId] = p;
  return { pergunta, posicoes };
}

/** Rascunho igual ao conteúdo publicado (valores iniciais do formulário). */
export function rascunhoDoPublicado(ref: Referencia): Rascunho {
  const { pergunta } = ref;
  const posicoes: Rascunho["posicoes"] = {};
  for (const [cid, p] of Object.entries(ref.posicoes)) {
    posicoes[cid] = { value: p.value, confidence: p.confidence, summary: p.summary, rationale: p.rationale };
  }
  return {
    pergunta: {
      theme: pergunta.theme,
      text: pergunta.text,
      context: pergunta.context,
      options: pergunta.options.map((o) => ({ id: o.id, text: o.text })),
    },
    posicoes,
    revisada: false,
    nota: "",
  };
}

export type ErrosRascunho = Record<string, string>;

/** Primeira mensagem de erro por campo, com o caminho como chave (ex.: "posicoes.lula.summary"). */
function errosPorCampo(erro: z.ZodError): ErrosRascunho {
  const erros: ErrosRascunho = {};
  for (const issue of erro.issues) {
    const campo = issue.path.join(".") || "geral";
    erros[campo] ??= issue.message;
  }
  return erros;
}

/** Valida o rascunho e confere que ele corresponde à pergunta publicada (mesmas alternativas e candidatos). */
export function validarRascunho(
  ref: Referencia,
  entrada: unknown,
): { ok: true; rascunho: Rascunho } | { ok: false; erros: ErrosRascunho } {
  const r = rascunhoSchema.safeParse(entrada);
  if (!r.success) return { ok: false, erros: errosPorCampo(r.error) };

  const idsOpcoes = ref.pergunta.options.map((o) => o.id);
  const idsRascunho = r.data.pergunta.options.map((o) => o.id);
  if (idsRascunho.join() !== idsOpcoes.join()) return { ok: false, erros: { geral: "As alternativas não correspondem às da pergunta." } };

  const candidatos = Object.keys(ref.posicoes).sort();
  if (Object.keys(r.data.posicoes).sort().join() !== candidatos.join()) {
    return { ok: false, erros: { geral: "Os candidatos não correspondem aos cadastrados." } };
  }

  const erros: ErrosRascunho = {};
  for (const cid of candidatos) {
    // Posição documentada exige fonte; as fontes só são cadastradas em positions.json.
    if (r.data.posicoes[cid].value !== null && ref.posicoes[cid].evidence.length === 0) {
      erros[`posicoes.${cid}.value`] = "Sem fontes cadastradas: para atribuir uma alternativa, inclua a fonte em positions.json.";
    }
  }
  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return { ok: true, rascunho: r.data };
}

/** Campos que diferem do publicado (para destacar na tela). Não considera "revisada" nem a nota. */
export function camposAlterados(publicado: Rascunho, atual: Rascunho): Set<string> {
  const alterados = new Set<string>();
  for (const campo of ["theme", "text", "context"] as const) {
    if (atual.pergunta[campo].trim() !== publicado.pergunta[campo]) alterados.add(`pergunta.${campo}`);
  }
  publicado.pergunta.options.forEach((o, i) => {
    if (atual.pergunta.options[i]?.text.trim() !== o.text) alterados.add(`pergunta.options.${i}.text`);
  });
  for (const [cid, p] of Object.entries(publicado.posicoes)) {
    const a = atual.posicoes[cid];
    if (!a) continue;
    if (a.value !== p.value) alterados.add(`posicoes.${cid}.value`);
    if (a.value !== null && a.confidence !== p.confidence) alterados.add(`posicoes.${cid}.confidence`);
    if (a.summary.trim() !== p.summary) alterados.add(`posicoes.${cid}.summary`);
    if (a.rationale.trim() !== p.rationale) alterados.add(`posicoes.${cid}.rationale`);
  }
  return alterados;
}

/** "2.6.0" → "2.6.1". Versões fora do padrão ganham o sufixo ".1". */
export function proximaVersao(versao: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(versao);
  return m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : `${versao}.1`;
}

/** Data de hoje (AAAA-MM-DD) no horário de Brasília. */
export function hojeEmBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

/**
 * Aplica os rascunhos sobre os arquivos publicados. Se o conteúdo mudar, a versão do arquivo sobe
 * (as participações registram a versão usada). reviewStatus só vira "revisado" com todas as perguntas revisadas.
 * As fontes, a ordem e os demais campos são preservados, para o diff no git mostrar só a revisão.
 */
export function aplicarRascunhos(base: ArquivosPublicados, rascunhos: Record<string, Rascunho>, hoje: string): ArquivosPublicados {
  const questions = base.questions.questions.map((q): Question => {
    const r = rascunhos[q.id];
    if (!r) return q;
    const textos = new Map(r.pergunta.options.map((o) => [o.id, o.text]));
    return {
      ...q,
      theme: r.pergunta.theme,
      text: r.pergunta.text,
      context: r.pergunta.context,
      options: q.options.map((o) => ({ ...o, text: textos.get(o.id) ?? o.text })),
    };
  });

  const positions = base.positions.positions.map((p): Position => {
    const r = rascunhos[p.questionId]?.posicoes[p.candidateId];
    if (!r) return p;
    // Mesma ordem de campos do arquivo. A confiança de posição documentada já foi exigida em rascunhoSchema.
    const { questionId, candidateId, evidence } = p;
    const { summary, rationale } = r;
    return r.value === null
      ? { questionId, candidateId, status: "insufficient", value: null, confidence: null, summary, rationale, evidence }
      : { questionId, candidateId, status: "documented", value: r.value, confidence: r.confidence ?? "media", summary, rationale, evidence };
  });

  const perguntasMudaram = JSON.stringify(questions) !== JSON.stringify(base.questions.questions);
  const posicoesMudaram = JSON.stringify(positions) !== JSON.stringify(base.positions.positions);
  const todasRevisadas = base.questions.questions.every((q) => rascunhos[q.id]?.revisada);

  return {
    questions: {
      ...base.questions,
      version: perguntasMudaram ? proximaVersao(base.questions.version) : base.questions.version,
      questions,
    },
    positions: {
      ...base.positions,
      version: posicoesMudaram ? proximaVersao(base.positions.version) : base.positions.version,
      updatedAt: posicoesMudaram ? hoje : base.positions.updatedAt,
      reviewStatus: todasRevisadas ? "revisado" : "pendente",
      positions,
    },
  };
}

/** Mesmas regras de src/lib/data.test.ts (que roda antes do build). Devolve a lista de problemas. */
export function validarArquivos(arquivos: ArquivosPublicados): string[] {
  const problemas: string[] = [];
  const q = questionsFileSchema.safeParse(arquivos.questions);
  if (!q.success) problemas.push(...q.error.issues.map((i) => `questions.json, ${i.path.join(".")}: ${i.message}`));
  const p = positionsFileSchema.safeParse(arquivos.positions);
  if (!p.success) problemas.push(...p.error.issues.map((i) => `positions.json, ${i.path.join(".")}: ${i.message}`));

  for (const pergunta of arquivos.questions.questions) {
    for (const c of arquivos.positions.candidates) {
      const n = arquivos.positions.positions.filter((x) => x.questionId === pergunta.id && x.candidateId === c.id).length;
      if (n !== 1) problemas.push(`positions.json: ${pergunta.id} / ${c.id} tem ${n} posições (esperado 1).`);
    }
  }
  return problemas;
}

/** Conteúdo do arquivo no mesmo formato dos JSON do repositório (2 espaços, quebra de linha final). */
export function serializarArquivo(dados: unknown): string {
  return `${JSON.stringify(dados, null, 2)}\n`;
}
