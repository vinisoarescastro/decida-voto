import Image from "next/image";
import type { ThemeResult } from "@/lib/affinity";
import { candidates } from "@/lib/data";
import type { Candidate } from "@/lib/schema";
import { vereditoDoTema, type Veredito } from "@/lib/veredito";
import { MaisDetalhes } from "@/components/ui/disclosure";
import { BORDA_CANDIDATO, Sobretitulo } from "@/components/ui/text";
import { ListaFontes } from "./evidence-list";

// "Pergunta a pergunta": para cada pergunta, só com quem a pessoa concorda mais (sem porcentagem), a resposta
// dela e a do candidato mais próximo (ou dos dois, quando empata). As posições completas dos dois continuam
// em "Entenda seu resultado" › "Detalhes por tema".

const indiceDe = (id: string) => candidates.findIndex((c) => c.id === id);
const candidatoDe = (id: string) => candidates[indiceDe(id)];

function Foto({ c, destaque }: { c: Candidate; destaque?: boolean }) {
  return (
    <Image
      src={`/candidatos/${c.id}.jpg`}
      alt=""
      width={192}
      height={192}
      className={`shrink-0 rounded-full object-cover ring-2 ring-offset-2 ring-offset-surface ${indiceDe(c.id) === 0 ? "ring-cand-1" : "ring-cand-2"} ${
        destaque ? "size-12" : "size-9"
      }`}
    />
  );
}

function Frase({ v }: { v: Veredito }) {
  switch (v.tipo) {
    case "concorda":
      return (
        <>
          Nesta pergunta, você <strong>concorda com {candidatoDe(v.candidatoId).name}</strong>.
        </>
      );
    case "mais-perto":
      return (
        <>
          Nesta pergunta, você <strong>concorda mais com {candidatoDe(v.candidatoId).name}</strong>.
        </>
      );
    case "os-dois":
      return (
        <>
          Nesta pergunta, você <strong>concorda com os dois</strong>.
        </>
      );
    case "diferente-dos-dois":
      return (
        <>
          Nesta pergunta, <strong>os dois candidatos pensam igual</strong>, e a sua resposta é diferente da deles.
        </>
      );
    case "entre":
      return (
        <>
          Nesta pergunta, sua resposta fica <strong>entre os dois</strong>.
        </>
      );
    case "sem-dados":
      return <>Nesta pergunta, não há posição documentada para comparar.</>;
  }
}

/** Resposta de um ou mais candidatos (mesma alternativa), com o resumo e as fontes sob demanda. */
function RespostaCandidatos({ tema, ids }: { tema: ThemeResult; ids: string[] }) {
  const posicoes = ids.map((id) => tema.candidates.find((c) => c.candidateId === id)!.position!);
  const primeira = posicoes[0];
  if (primeira.status !== "documented") return null;
  const alternativa = tema.question.options.find((o) => o.value === primeira.value)!;
  const nomes = ids.map((id) => candidatoDe(id).name);
  const titulo = nomes.length === 2 ? `${nomes[0]} e ${nomes[1]} responderam o mesmo` : `Resposta de ${nomes[0]}`;
  return (
    <div className={`rounded-2xl border-l-4 bg-surface-2/80 px-4 py-3 ${ids.length === 1 ? BORDA_CANDIDATO[indiceDe(ids[0])] : "border-line-strong"}`}>
      <p className="text-xs font-medium text-muted">{titulo}</p>
      <p className="mt-1 font-medium">{alternativa.text}</p>
      {posicoes.map((p, i) =>
        p.status === "documented" ? (
          <div key={ids[i]} className="mt-1">
            <MaisDetalhes rotulo={`Por que essa é a posição de ${nomes[i]}?`}>
              <p className="text-sm leading-relaxed text-muted">{p.summary}</p>
              {p.evidence.length > 0 && (
                <div className="mt-3">
                  <ListaFontes fontes={p.evidence} />
                </div>
              )}
            </MaisDetalhes>
          </div>
        ) : null,
      )}
    </div>
  );
}

function CartaoPergunta({ tema, numero }: { tema: ThemeResult; numero: number }) {
  const v = vereditoDoTema(tema);
  const resposta = tema.question.options.find((o) => o.id === tema.userOptionId)!;
  const [a, b] = candidates.map((c) => c.id);
  // Quem aparece: o mais próximo; os dois quando concordam entre si ou quando a pessoa fica entre eles.
  const mostrados = v.tipo === "concorda" || v.tipo === "mais-perto" ? [v.candidatoId] : v.tipo === "sem-dados" ? [] : [a, b];

  return (
    <li className="rounded-3xl border border-line bg-surface/90 p-5 shadow-sm sm:p-6">
      <Sobretitulo>
        {numero}. {tema.question.theme}
      </Sobretitulo>
      <p className="mt-1.5 font-medium leading-snug">{tema.question.text}</p>

      <div className="mt-4 flex items-center gap-3">
        {mostrados.length > 0 && (
          <span className="flex shrink-0 -space-x-2">
            {mostrados.map((id) => (
              <Foto key={id} c={candidatoDe(id)} destaque={mostrados.length === 1} />
            ))}
          </span>
        )}
        <p className="text-[15px] leading-snug">
          <Frase v={v} />
        </p>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-2xl border-l-4 border-ink bg-surface-2/80 px-4 py-3">
          <p className="text-xs font-medium text-muted">Sua resposta</p>
          <p className="mt-1 font-medium">{resposta.text}</p>
        </div>
        {v.tipo === "entre" ? (
          // Mesma distância: mostra os dois, cada um com a sua resposta.
          <div className="grid gap-2.5 sm:col-span-2 sm:grid-cols-2">
            <RespostaCandidatos tema={tema} ids={[a]} />
            <RespostaCandidatos tema={tema} ids={[b]} />
          </div>
        ) : mostrados.length > 0 ? (
          <RespostaCandidatos tema={tema} ids={mostrados} />
        ) : null}
      </div>
    </li>
  );
}

export function PerguntaAPergunta({ temas }: { temas: ThemeResult[] }) {
  return (
    <ol className="space-y-3">
      {temas.map((t, i) => (
        <CartaoPergunta key={t.question.id} tema={t} numero={i + 1} />
      ))}
    </ol>
  );
}
