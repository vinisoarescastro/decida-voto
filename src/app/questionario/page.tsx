import type { Metadata } from "next";
import { CarregadorQuestionario } from "@/features/quiz/quiz-loader";

export const metadata: Metadata = {
  title: "Questionário",
  description: "Responda 10 perguntas sobre temas políticos, econômicos e sociais. Sem cadastro, em cerca de 3 minutos.",
};

export default function PaginaQuestionario() {
  return <CarregadorQuestionario />;
}
