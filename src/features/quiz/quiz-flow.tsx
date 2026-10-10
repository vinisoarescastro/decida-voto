"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { computeAffinity, type Answers } from "@/lib/affinity";
import { candidates, positions, questions } from "@/lib/data";
import { shuffleOptions } from "@/lib/shuffle";
import { Botao } from "@/components/ui/button";
import { IconeVoltar } from "@/components/ui/icon";
import { TelaResultado } from "@/features/result/result-screen";
import { BarraAcoes } from "./action-bar";
import { enviarParticipacao, ErroInicio, iniciarQuestionario, type StatusEnvio } from "./api";
import { ordemDoPasso, passoParaUrl, resolverPasso, type Passo } from "./passos";
import { FormularioPerfil, PERFIL_VAZIO, type PerfilForm } from "./profile-form";
import { TelaPergunta } from "./question-screen";
import { BarraProgresso } from "./quiz-top-bar";

// Fluxo: perfil → 10 perguntas → resultado.
// - Cada passo é uma entrada no histórico (?passo=N), então o "voltar" do celular volta uma pergunta.
// - As respostas ficam só na memória desta página: nada vai para cookies ou armazenamento local.
// - O resultado aparece na hora (calculado aqui) e, em paralelo, perfil e respostas são enviados
//   ao servidor, que recalcula a afinidade e grava sem identificação pessoal.

function irPara(passo: Passo, modo: "push" | "replace" = "push") {
  const valor = passoParaUrl(passo);
  const url = valor ? `?passo=${valor}` : window.location.pathname;
  window.history[modo === "push" ? "pushState" : "replaceState"](null, "", url);
}

export function FluxoQuestionario() {
  const parametros = useSearchParams();
  const [perfil, setPerfil] = useState<PerfilForm>(PERFIL_VAZIO);
  const [token, setToken] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [erroInicio, setErroInicio] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Answers>({});
  // Ordem das alternativas sorteada a cada abertura; fica fixa durante o preenchimento.
  const [ordem, setOrdem] = useState(() => shuffleOptions(questions));
  const [envio, setEnvio] = useState<StatusEnvio | null>(null);
  const envioDisparado = useRef(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const valorUrl = parametros.get("passo");
  const passo = resolverPasso(valorUrl, token !== null, questions, respostas);
  const passoCanonico = passoParaUrl(passo);

  // Endereço inválido ou à frente do permitido (ex.: recarregou a página): corrige sem criar histórico.
  useEffect(() => {
    if (passoCanonico !== valorUrl) irPara(passo, "replace");
  }, [passoCanonico, valorUrl, passo]);

  // Direção da animação (avançando ou voltando), ajustada quando o passo muda.
  const ordemAtual = ordemDoPasso(passo);
  const [ultimaOrdem, setUltimaOrdem] = useState(ordemAtual);
  const [direcao, setDirecao] = useState<"avancar" | "voltar">("avancar");
  if (ultimaOrdem !== ordemAtual) {
    setDirecao(ordemAtual > ultimaOrdem ? "avancar" : "voltar");
    setUltimaOrdem(ordemAtual);
  }
  const animacao = direcao === "avancar" ? "animate-avancar" : "animate-voltar";

  // A cada troca de tela, leva o foco ao título (leitores de tela) e volta ao topo.
  const primeiraTela = useRef(true);
  useEffect(() => {
    if (primeiraTela.current) {
      primeiraTela.current = false;
      return;
    }
    tituloRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [ordemAtual]);

  // Evita perder as respostas ao fechar ou recarregar a página no meio do questionário.
  const emAndamento = token !== null && passo.tipo !== "resultado" && Object.keys(respostas).length > 0;
  useEffect(() => {
    if (!emAndamento) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [emAndamento]);

  // Envio único por questionário, ao chegar ao resultado pela primeira vez.
  useEffect(() => {
    if (passo.tipo !== "resultado" || !token || envioDisparado.current) return;
    envioDisparado.current = true;
    setEnvio("enviando");
    enviarParticipacao(perfil, respostas, token).then(setEnvio);
  }, [passo.tipo, token, perfil, respostas]);

  async function continuarDoPerfil() {
    if (token) {
      // Voltou para corrigir o perfil: segue de onde parou, sem pedir novo token.
      irPara(resolverPasso(String(questions.length), true, questions, respostas));
      return;
    }
    setIniciando(true);
    setErroInicio(null);
    try {
      setToken(await iniciarQuestionario());
      irPara({ tipo: "pergunta", indice: 0 });
    } catch (e) {
      setErroInicio(e instanceof ErroInicio ? e.message : "Não foi possível iniciar agora.");
    } finally {
      setIniciando(false);
    }
  }

  const avancar = useCallback(() => {
    if (passo.tipo !== "pergunta" || !respostas[questions[passo.indice].id]) return;
    irPara(passo.indice === questions.length - 1 ? { tipo: "resultado" } : { tipo: "pergunta", indice: passo.indice + 1 });
  }, [passo, respostas]);

  const escolher = useCallback(
    (idAlternativa: string) => {
      if (passo.tipo !== "pergunta") return;
      const id = questions[passo.indice].id;
      setRespostas((anteriores) => ({ ...anteriores, [id]: idAlternativa }));
    },
    [passo],
  );

  function recomecar() {
    setRespostas({});
    setOrdem(shuffleOptions(questions));
    setToken(null);
    setEnvio(null);
    envioDisparado.current = false;
    irPara({ tipo: "perfil" }, "replace");
  }

  if (passo.tipo === "resultado") {
    const resultado = computeAffinity(questions, candidates, positions, respostas);
    return (
      <TelaResultado
        resultado={resultado}
        envio={envio}
        tituloRef={tituloRef}
        aoRefazer={recomecar}
        aoRevisar={() => window.history.back()}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-4 muito-baixa:pt-1 sm:px-6 sm:pt-14 sm:baixa:pt-8 sm:muito-baixa:pt-6">
      {passo.tipo === "perfil" ? (
        <div className="flex flex-1 flex-col pt-4 muito-baixa:pt-2 sm:pt-0">
          <FormularioPerfil
            valor={perfil}
            aoMudar={setPerfil}
            aoContinuar={continuarDoPerfil}
            enviando={iniciando}
            erroGeral={erroInicio}
            tituloRef={tituloRef}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <BarraProgresso atual={passo.indice} total={questions.length} respondidas={questions.map((q) => Boolean(respostas[q.id]))} />
          <div className="mt-6 muito-baixa:mt-3 sm:mt-10 sm:baixa:mt-6">
            <TelaPergunta
              key={questions[passo.indice].id}
              pergunta={questions[passo.indice]}
              alternativas={ordem[questions[passo.indice].id]}
              escolhida={respostas[questions[passo.indice].id]}
              tituloRef={tituloRef}
              aoEscolher={escolher}
              aoAvancar={avancar}
              animacao={animacao}
            />
          </div>
          <BarraAcoes>
            <Botao variante="secundario" onClick={() => window.history.back()} className="shrink-0">
              <IconeVoltar tamanho={20} />
              <span className="sr-only sm:not-sr-only">Anterior</span>
            </Botao>
            <Botao onClick={avancar} disabled={!respostas[questions[passo.indice].id]} className="flex-1 sm:flex-none sm:min-w-40">
              {passo.indice === questions.length - 1 ? "Ver resultado" : "Próxima"}
            </Botao>
          </BarraAcoes>
          <p aria-live="polite" className="sr-only">
            {!respostas[questions[passo.indice].id] && "Escolha uma alternativa para continuar."}
          </p>
        </div>
      )}
    </div>
  );
}
