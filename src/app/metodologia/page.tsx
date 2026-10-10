import type { Metadata } from "next";
import { PaginaConteudo, Secao } from "@/components/layout/page";
import { Expansivel, MaisDetalhes } from "@/components/ui/disclosure";
import { Sumario } from "@/components/ui/text";
import { DetalhePosicao } from "@/features/result/position-detail";
import { findPosition, MAX_DISTANCE, SIMILARITY_THRESHOLD } from "@/lib/affinity";
import { candidates, formatDate, positions, positionsFile, questions, questionsFile } from "@/lib/data";
import { responsavelPublico } from "@/server/responsavel-publico";

const TSE_RESULT_URL =
  "https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/flavio-bolsonaro-e-lula-vao-disputar-o-2o-turno-para-a-presidencia-da-republica";

export const metadata: Metadata = {
  title: "Metodologia e fontes",
  description: "Como o site Em quem votar? calcula a afinidade e quais fontes sustentam cada posição atribuída aos candidatos.",
};

const lista = "list-disc space-y-2 pl-5";

export default async function PaginaMetodologia() {
  // E-mail de contato vem do banco (editável no painel administrativo).
  const { email } = await responsavelPublico();
  const documentadas = positions.filter((p) => p.status === "documented").length;

  return (
    <PaginaConteudo
      titulo="Metodologia e fontes"
      intro={
        <>
          <p className="text-[1.0625rem] leading-relaxed text-muted text-pretty">
            Esta página explica, passo a passo, como o resultado é calculado e mostra todas as posições atribuídas aos
            candidatos, com as fontes que as sustentam. Qualquer pessoa pode refazer o cálculo com estas informações.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            O 2º turno presidencial, em 25 de outubro de 2026, entre Flávio Bolsonaro (PL) e Lula (PT), foi confirmado pela
            totalização do Tribunal Superior Eleitoral.{" "}
            <a href={TSE_RESULT_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
              Ver notícia oficial do TSE
            </a>
            .
          </p>
          <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-surface/80 p-4 text-sm sm:grid-cols-3">
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
                {documentadas} de {positions.length}
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
        </>
      }
    >
      <Secao id="principios" titulo="Princípios">
        <ul className={lista}>
          <li>Nenhuma posição é atribuída a um candidato sem fonte verificável.</li>
          <li>
            Quando não há informação suficiente, o tema é marcado como “informação insuficiente” e fica fora do cálculo, em
            vez de receber uma correspondência inventada.
          </li>
          <li>Os mesmos critérios de fonte e de interpretação são aplicados aos dois candidatos.</li>
          <li>O resultado é uma estimativa de afinidade, não uma previsão ou recomendação de voto.</li>
        </ul>
      </Secao>

      <Secao id="calculo" titulo="Como o cálculo funciona">
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
            Em cada tema, <strong>100 pontos são divididos entre os dois candidatos</strong>. Cada um recebe a distância do{" "}
            <em>outro</em> até a sua resposta, dividida pela soma das duas distâncias. Assim, quem está mais perto leva mais
            pontos. Se as duas distâncias forem iguais, inclusive quando os candidatos têm a mesma posição, o tema fica 50 ×
            50.
          </li>
          <li>
            Todos os temas têm o mesmo peso. O resultado é a média dos pontos, considerando apenas os temas em que os{" "}
            <strong>dois</strong> candidatos têm posição documentada. Os dois percentuais somam 100%.
          </li>
          <li>
            O resultado é exibido com uma casa decimal. Diferenças menores que {SIMILARITY_THRESHOLD} pontos (por exemplo, 45%
            × 55%) são apresentadas como resultado equilibrado.
          </li>
          <li>
            Como a divisão é relativa, ela não mostra se você concorda pouco com os dois. Por isso, os detalhes do resultado
            também trazem a <strong>concordância absoluta</strong> com cada candidato: 1 − distância ÷ {MAX_DISTANCE} em cada
            tema (mesma alternativa = 100%; uma de distância = 66,7%; duas = 33,3%; três = 0%).
          </li>
        </ol>
        <p>
          <strong>Exemplo:</strong> se você escolhe a alternativa de valor 4 e as posições documentadas são 1 e 3, as
          distâncias são 3 e 1. O primeiro candidato recebe 1 ÷ 4 = 25 pontos e o segundo, 3 ÷ 4 = 75 pontos. Esses pontos
          entram na média junto com os dos demais temas.
        </p>
      </Secao>

      <Secao id="fontes" titulo="Critérios de fonte">
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
      </Secao>

      <Secao id="neutralidade" titulo="Cuidados com a imparcialidade">
        <ul className={lista}>
          <li>Os candidatos aparecem sempre em ordem alfabética.</li>
          <li>
            A interface do site usa apenas tons neutros. Só os gráficos usam uma cor para cada candidato (violeta e magenta),
            de mesmo peso visual e sem relação com as cores dos partidos. O site não usa cores, símbolos ou slogans de
            campanha.
          </li>
          <li>As perguntas e alternativas foram redigidas para não induzir respostas e são submetidas a revisão humana.</li>
          <li>As notícias são selecionadas por tema, com o mesmo critério para os dois candidatos, e não pelo seu resultado.</li>
        </ul>
      </Secao>

      <Secao id="limitacoes" titulo="Limitações">
        <ul className={lista}>
          <li>Dez perguntas não cobrem todos os temas relevantes de uma eleição.</li>
          <li>
            Resumir uma posição política em uma de quatro alternativas é uma simplificação. Posições podem mudar ao longo da
            campanha.
          </li>
          <li>
            Há assimetria de informação: um candidato tem histórico de governo, o outro tem histórico parlamentar. Por isso
            cada posição informa sua fonte e seu grau de confiança.
          </li>
          <li>
            O resultado não considera outros fatores importantes para o voto, como trajetória, equipe, alianças ou confiança
            pessoal.
          </li>
        </ul>
        {email && (
          <p>
            Encontrou um erro ou uma fonte melhor? Escreva para{" "}
            <a href={`mailto:${email}`} className="underline underline-offset-4">
              {email}
            </a>
            .
          </p>
        )}
      </Secao>

      <section aria-labelledby="posicoes" className="space-y-4">
        <h2 id="posicoes" className="text-xl font-semibold tracking-tight">
          Posições por tema
        </h2>
        <p className="text-[15px] text-muted">Toque em um tema para ver a posição de cada candidato e as fontes.</p>
        <div className="divide-y divide-line border-y border-line">
          {questions.map((q) => (
            <Expansivel key={q.id} titulo={q.theme}>
              <div className="space-y-5">
                <p className="text-[15px] text-muted">{q.text}</p>
                <MaisDetalhes rotulo="Ver alternativas e valores">
                  <ul className="space-y-1 text-sm text-muted">
                    {q.options.map((o) => (
                      <li key={o.id}>
                        <span className="font-mono text-ink">[{o.value}]</span> {o.text}
                      </li>
                    ))}
                  </ul>
                </MaisDetalhes>
                {candidates.map((c) => (
                  <DetalhePosicao key={c.id} pergunta={q} idCandidato={c.id} posicao={findPosition(positions, q.id, c.id)} />
                ))}
              </div>
            </Expansivel>
          ))}
        </div>
      </section>
    </PaginaConteudo>
  );
}
