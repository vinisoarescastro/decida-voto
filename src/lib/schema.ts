import { z } from "zod";

// Esquemas dos arquivos em src/data. São validados nos testes (npm test), que
// rodam antes do build: dados sem fonte ou malformados impedem a publicação.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD");
const httpsUrl = z.string().url().startsWith("https://", "Use apenas links https");
const scaleValue = z.number().int().min(1).max(4);

export const optionSchema = z.object({
  id: z.string().min(1),
  value: scaleValue,
  text: z.string().min(1),
});

export const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  theme: z.string().min(1),
  text: z.string().min(1),
  context: z.string().min(1),
  options: z
    .array(optionSchema)
    .length(4)
    .refine((opts) => new Set(opts.map((o) => o.value)).size === 4, "Cada alternativa precisa de um valor distinto de 1 a 4"),
});

export const questionsFileSchema = z.object({
  version: z.string().min(1),
  questions: z.array(questionSchema).length(10),
});

export const evidenceTypes = ["plano-de-governo", "ato-oficial", "votacao", "declaracao", "noticia", "checagem"] as const;

export const evidenceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: httpsUrl,
  publishedAt: isoDate.nullable(),
  type: z.enum(evidenceTypes),
  excerpt: z.string().min(1),
});

export const candidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  party: z.string().min(1),
});

const documentedPosition = z.object({
  questionId: z.string().min(1),
  candidateId: z.string().min(1),
  status: z.literal("documented"),
  value: scaleValue,
  confidence: z.enum(["alta", "media"]),
  summary: z.string().min(1),
  rationale: z.string().min(1),
  evidence: z.array(evidenceSchema).min(1, "Posição documentada exige ao menos uma fonte"),
});

const insufficientPosition = z.object({
  questionId: z.string().min(1),
  candidateId: z.string().min(1),
  status: z.literal("insufficient"),
  value: z.null(),
  confidence: z.null(),
  summary: z.string().min(1),
  rationale: z.string(),
  evidence: z.array(evidenceSchema),
});

export const positionSchema = z.discriminatedUnion("status", [documentedPosition, insufficientPosition]);

export const positionsFileSchema = z.object({
  version: z.string().min(1),
  updatedAt: isoDate,
  reviewStatus: z.enum(["pendente", "revisado"]),
  candidates: z.array(candidateSchema).length(2),
  positions: z.array(positionSchema),
});

export const newsTypes = ["noticia", "analise", "declaracao-oficial", "checagem"] as const;

export const newsItemSchema = z.object({
  questionId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  publisher: z.string().min(1),
  publishedAt: isoDate.nullable(),
  url: httpsUrl,
  type: z.enum(newsTypes),
  candidates: z.array(z.string()),
});

export const newsFileSchema = z.object({
  updatedAt: isoDate,
  reviewStatus: z.enum(["pendente", "revisado"]),
  items: z.array(newsItemSchema),
});

export type Option = z.infer<typeof optionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionsFile = z.infer<typeof questionsFileSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type EvidenceType = Evidence["type"];
export type Candidate = z.infer<typeof candidateSchema>;
export type Position = z.infer<typeof positionSchema>;
export type PositionsFile = z.infer<typeof positionsFileSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type NewsType = NewsItem["type"];
export type NewsFile = z.infer<typeof newsFileSchema>;
