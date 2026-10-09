import type { Metadata } from "next";
import { QuizLoader } from "@/components/quiz/QuizLoader";

export const metadata: Metadata = {
  title: "Questionário",
  description: "Responda 10 perguntas sobre temas políticos, econômicos e sociais. Sem cadastro e sem armazenar respostas.",
};

export default function QuestionarioPage() {
  return <QuizLoader />;
}
