import questionsJson from "@/data/questions.json";
import positionsJson from "@/data/positions.json";
import newsJson from "@/data/news.json";
import type { NewsFile, PositionsFile, QuestionsFile } from "./schema";

// Os arquivos JSON são validados por src/lib/data.test.ts (executado antes do build).
// Aqui apenas os tipamos, para não incluir a biblioteca de validação no pacote do navegador.

export const questionsFile = questionsJson as QuestionsFile;
export const positionsFile = positionsJson as PositionsFile;
export const newsFile = newsJson as NewsFile;

export const questions = questionsFile.questions;
export const candidates = positionsFile.candidates;
export const positions = positionsFile.positions;
export const newsItems = newsFile.items;

export function candidateName(id: string): string {
  return candidates.find((c) => c.id === id)?.name ?? id;
}

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  "plano-de-governo": "Plano de governo",
  "ato-oficial": "Ato oficial",
  votacao: "Votação",
  declaracao: "Declaração",
  noticia: "Notícia",
  checagem: "Checagem de fatos",
};

export const NEWS_TYPE_LABELS: Record<string, string> = {
  noticia: "Notícia",
  analise: "Análise",
  "declaracao-oficial": "Declaração oficial",
  checagem: "Checagem de fatos",
};

export function formatDate(iso: string | null): string {
  if (!iso) return "Data não informada";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
