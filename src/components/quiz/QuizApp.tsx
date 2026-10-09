"use client";

import { useEffect, useRef, useState } from "react";
import { computeAffinity, type Answers } from "@/lib/affinity";
import { candidates, positions, questions } from "@/lib/data";
import { shuffleOptions } from "@/lib/shuffle";
import { QuestionStep } from "./QuestionStep";
import { PERFIL_VAZIO, ProfileStep, type PerfilForm } from "./ProfileStep";
import { ResultView } from "@/components/result/ResultView";
import { Button } from "@/components/ui/Button";
import { IconeSetaEsquerda } from "@/components/ui/Icon";

// Fluxo: perfil (o clique em "Continuar" vale como ciência e concordância) → perguntas → resultado.
// O resultado é calculado no navegador e exibido na hora; em paralelo, o perfil e as respostas
// são enviados ao servidor, que recalcula a afinidade e grava apenas dados sem identificação pessoal.

export type StatusEnvio = "enviando" | "ok" | "repetido" | "limite" | "erro";

type Fase = "perfil" | "perguntas" | "resultado";

export function QuizApp() {
  const [fase, setFase] = useState<Fase>("perfil");
  const [perfil, setPerfil] = useState<PerfilForm>(PERFIL_VAZIO);
  const [token, setToken] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [erroInicio, setErroInicio] = useState<string | null>(null);
  const [envio, setEnvio] = useState<StatusEnvio | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  // Ordem sorteada ao abrir o questionário; fica fixa durante o preenchimento (inclusive ao voltar).
  const [optionOrder, setOptionOrder] = useState(() => shuffleOptions(questions));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Leva o foco ao título a cada troca de tela, para leitores de tela e teclado.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [index, fase]);

  async function iniciar() {
    setIniciando(true);
    setErroInicio(null);
    try {
      const r = await fetch("/api/token/", { method: "POST" });
      if (r.status === 429) throw new Error("Muitas tentativas a partir desta rede. Tente novamente mais tarde.");
      if (!r.ok) throw new Error("Não foi possível iniciar agora. Tente novamente em instantes.");
      setToken((await r.json()).token);
      setFase("perguntas");
    } catch (e) {
      setErroInicio(e instanceof Error ? e.message : "Não foi possível iniciar agora.");
    } finally {
      setIniciando(false);
    }
  }

  async function enviarParticipacao() {
    // Envia uma única vez por questionário (revisar respostas não gera novo envio).
    if (envio !== null || !token) return;
    setEnvio("enviando");
    try {
      const r = await fetch("/api/participacoes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfil: { uf: perfil.uf, municipio: Number(perfil.municipio), genero: perfil.genero, idade: Number(perfil.idade.trim()) },
          respostas: answers,
          // A pessoa só chega aqui depois de clicar em "Continuar", junto ao aviso de termos e privacidade.
          consentimento: true,
          token,
          site: perfil.site,
        }),
      });
      setEnvio(r.ok ? "ok" : r.status === 409 ? "repetido" : r.status === 429 ? "limite" : "erro");
    } catch {
      setEnvio("erro");
    }
  }

  function concluir() {
    setFase("resultado");
    void enviarParticipacao();
  }

  function restart() {
    setOptionOrder(shuffleOptions(questions));
    setAnswers({});
    setIndex(0);
    setToken(null);
    setEnvio(null);
    setFase("perfil");
  }

  if (fase === "perfil") {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-14 sm:pt-20">
        <ProfileStep
          value={perfil}
          onChange={setPerfil}
          onSubmit={iniciar}
          enviando={iniciando}
          erroGeral={erroInicio}
          headingRef={headingRef}
        />
      </div>
    );
  }

  if (fase === "resultado") {
    const result = computeAffinity(questions, candidates, positions, answers);
    return (
      <ResultView result={result} envio={envio} headingRef={headingRef} onRestart={restart} onEdit={() => setFase("perguntas")} />
    );
  }

  const question = questions[index];
  const current = answers[question.id];
  const isLast = index === questions.length - 1;
  const progress = ((index + (current ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-14 sm:pt-20">
      <div className="flex items-baseline justify-between gap-4 text-xs">
        <span className="font-medium uppercase tracking-[0.14em] text-accent">{question.theme}</span>
        <span className="tabular-nums text-muted">
          {index + 1} / {questions.length}
          <span className="sr-only">. Pergunta {index + 1} de {questions.length}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do questionário"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-3 h-1 overflow-hidden rounded-full bg-bar-track"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-12">
        <QuestionStep
          key={question.id}
          question={question}
          options={optionOrder[question.id]}
          selected={current}
          headingRef={headingRef}
          onSelect={(optionId) => setAnswers((prev) => ({ ...prev, [question.id]: optionId }))}
        />
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <Button variante="ghost" onClick={() => setIndex((i) => i - 1)} className={index === 0 ? "invisible" : "-ml-4"}>
          <IconeSetaEsquerda />
          Anterior
        </Button>
        <Button onClick={() => (isLast ? concluir() : setIndex((i) => i + 1))} disabled={!current} className="min-w-32">
          {isLast ? "Ver resultado" : "Próxima"}
        </Button>
      </div>
      <p aria-live="polite" className="mt-3 h-5 text-right text-xs text-muted">
        {!current && "Escolha uma alternativa para continuar."}
      </p>
    </div>
  );
}
