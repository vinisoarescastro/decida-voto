import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PositionCard } from "@/components/PositionCard";
import { Sumario } from "@/components/ui/Sumario";
import { findPosition, MAX_DISTANCE, SIMILARITY_THRESHOLD } from "@/lib/affinity";
import { candidates, formatDate, positions, positionsFile, questions, questionsFile } from "@/lib/data";
import { CONTACT_EMAIL } from "@/lib/site";

const TSE_RESULT_URL =
  "https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/flavio-bolsonaro-e-lula-vao-disputar-o-2o-turno-para-a-presidencia-da-republica";

export const metadata: Metadata = {
  title: "Metodologia e fontes",
  description: "Como o Decida Voto calcula a afinidade e quais fontes sustentam cada posição atribuída aos candidatos.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function MetodologiaPage() {
  const documentedCount = positions.filter((p) => p.status === "documented").length;

  return (
    <div className="animate-surgir mx-auto max-w-2xl space-y-16 px-6 pt-14 sm:pt-20">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Metodologia e fontes</h1>
        <p className="text-muted text-pretty">
          Esta página explica, passo a passo, como o resultado é calculado e mostra todas as posições atribuídas aos
          candidatos, com as fontes que as sustentam. Qualquer pessoa pode refazer o cálculo com estas informações.
        </p>
        <p className="text-sm text-muted">
          O 2º turno presidencial, em 25 de outubro de 2026, entre Flávio Bolsonaro (PL) e Lula (PT), foi confirmado pela
          totalização do Tribunal Superior Eleitoral.{" "}
          <a href={TSE_RESULT_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
            Ver notícia oficial do TSE
          </a>
          .
        </p>
        <dl className="grid gap-4 border-y border-line py-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Versão das perguntas</dt>
            <dd className="font-medium">{questionsFile.version}</dd>
          </div>
          <div>
            <dt className="text-muted">Versão das posições</dt>
            <dd className="font-medium">
              {positionsFile.version} · {formatDate(positionsFile.updatedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Posições documentadas</dt>
            <dd className="font-medium">
              {documentedCount} de {positions.length}
            </dd>
          </div>
        </dl>
        <Sumario
          itens={[
            { id: "principios", rotulo: "Princípios" },
            { id: "calculo", rotulo: "Cálculo" },
            { id: "fontes", rotulo: "Fontes" },
            { id: "neutralidade", rotulo: "Imparcialidade" },
            { id: "limitacoes", rotulo: "Limitações" },
            { id: "posicoes", rotulo: "Posições por tema" },
          ]}
        />
      </header>

      <Section id="principios" title="Princípios">
        <ul className="list-disc space-y-2 pl-5">
          <li>Nenhuma posição é atribuída a um candidato sem fonte verificável.</li>
          <li>
            Quando não há informação suficiente, o tema é marcado como “informação insuficiente” e fica fora do cálculo,
            em vez de receber uma correspondência inventada.
          </li>
          <li>Os mesmos critérios de fonte e de interpretação são aplicados aos dois candidatos.</li>
          <li>O resultado é uma estimativa de afinidade, não uma previsão ou recomendação de voto.</li>
        </ul>
      </Section>

      <Section id="calculo" title="Como o cálculo funciona">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Cada pergunta tem 4 alternativas. Internamente, elas recebem valores de 1 a 4 que as ordenam de uma posição a
            outra oposta. A ordem em que aparecem na tela é sorteada sempre que o questionário é aberto, para que nenhuma
            posição fique sempre em primeiro ou em último lugar.
          </li>
          <li>
            Com base nas fontes, cada candidato recebe o valor da alternativa que mais se aproxima da sua posição
            documentada, com um grau de confiança (alta ou média).
          </li>
          <li>
            Em cada tema, <strong className="text-ink">100 pontos são divididos entre os dois candidatos</strong>. Cada um
            recebe a distância do <em>outro</em> até a sua resposta, dividida pela soma das duas distâncias. Assim, quem está
            mais perto leva mais pontos. Se as duas distâncias forem iguais, inclusive quando os candidatos têm a mesma
            posição, o tema fica 50 × 50.
          </li>
          <li>
            Todos os temas têm o mesmo peso. O resultado é a média dos pontos, considerando apenas os temas em que os{" "}
            <strong className="text-ink">dois</strong> candidatos têm posição documentada. Os dois percentuais somam 100%.
          </li>
          <li>
            O resultado é exibido com uma casa decimal. Diferenças menores que {SIMILARITY_THRESHOLD} pontos (por exemplo,
            45% × 55%) são apresentadas como resultado equilibrado.
          </li>
          <li>
            Como a divisão é relativa, ela não mostra se você concorda pouco com os dois. Por isso, os detalhes do resultado
            também trazem a <strong className="text-ink">concordância absoluta</strong> com cada candidato: 1 − distância ÷{" "}
            {MAX_DISTANCE} em cada tema (mesma alternativa = 100%; uma de distância = 66,7%; duas = 33,3%; três = 0%).
          </li>
        </ol>
        <p>
          <strong className="text-ink">Exemplo:</strong> se você escolhe a alternativa de valor 4 e as posições documentadas
          são 1 e 3, as distâncias são 3 e 1. O primeiro candidato recebe 1 ÷ 4 = 25 pontos e o segundo, 3 ÷ 4 = 75 pontos.
          Esses pontos entram na média junto com os dos demais temas.
        </p>
      </Section>

      <Section id="fontes" title="Critérios de fonte">
        <p>As fontes são priorizadas nesta ordem:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Plano de governo registrado no TSE e documentos oficiais da campanha;</li>
          <li>Votações nominais e projetos de lei;</li>
          <li>Atos oficiais de governo;</li>
          <li>Declarações públicas registradas por veículos jornalísticos reconhecidos;</li>
          <li>Checagens de fatos de agências independentes.</li>
        </ol>
        <p>
          Posições baseadas em documentos, atos ou votos explícitos recebem confiança alta. Posições que dependem de
          declarações ou de interpretação razoável recebem confiança média.
        </p>
      </Section>

      <Section id="neutralidade" title="Cuidados com a imparcialidade">
        <ul className="list-disc space-y-2 pl-5">
          <li>Os candidatos aparecem sempre em ordem alfabética.</li>
          <li>
            Nos gráficos, cada candidato tem uma cor própria (violeta e magenta), de mesmo peso visual e sem relação com as
            cores dos partidos. O site não usa cores, símbolos ou slogans de campanha.
          </li>
          <li>As perguntas e alternativas foram redigidas para não induzir respostas e são submetidas a revisão humana.</li>
          <li>As notícias são selecionadas por tema, com o mesmo critério para os dois candidatos, e não pelo seu resultado.</li>
        </ul>
      </Section>

      <Section id="limitacoes" title="Limitações">
        <ul className="list-disc space-y-2 pl-5">
          <li>Dez perguntas não cobrem todos os temas relevantes de uma eleição.</li>
          <li>
            Resumir uma posição política em uma de quatro alternativas é uma simplificação. Posições podem mudar ao longo
            da campanha.
          </li>
          <li>
            Há assimetria de informação: um candidato tem histórico de governo, o outro tem histórico parlamentar. Por
            isso cada posição informa sua fonte e seu grau de confiança.
          </li>
          <li>
            O resultado não considera outros fatores importantes para o voto, como trajetória, equipe, alianças ou
            confiança pessoal.
          </li>
        </ul>
        {CONTACT_EMAIL && (
          <p>
            Encontrou um erro ou uma fonte melhor? Escreva para{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        )}
      </Section>

      <section aria-labelledby="posicoes" className="space-y-10">
        <h2 id="posicoes" className="text-lg font-semibold">
          Posições por tema
        </h2>
        {questions.map((q) => (
          <article key={q.id} className="space-y-5 border-t border-line pt-8">
            <header className="space-y-1">
              <h3 className="font-semibold">{q.theme}</h3>
              <p className="text-muted">{q.text}</p>
            </header>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-accent">Ver alternativas e valores</summary>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {q.options.map((o) => (
                  <li key={o.id}>
                    <span className="font-mono text-ink">[{o.value}]</span> {o.text}
                  </li>
                ))}
              </ul>
            </details>
            <div className="space-y-6">
              {candidates.map((c) => (
                <PositionCard key={c.id} question={q} candidateId={c.id} position={findPosition(positions, q.id, c.id)} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
