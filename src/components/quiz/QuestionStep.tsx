import type { RefObject } from "react";
import type { Option, Question } from "@/lib/schema";

type Props = {
  question: Question;
  /** Alternativas na ordem em que devem aparecer (sorteada). */
  options: Option[];
  /** id da alternativa escolhida, se houver. */
  selected: string | undefined;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSelect: (optionId: string) => void;
};

export function QuestionStep({ question, options, selected, headingRef, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="contents">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
          {question.text}
        </h1>
      </legend>
      <p className="mt-4 text-sm leading-relaxed text-muted">{question.context}</p>
      <div className="mt-8 space-y-2.5">
        {options.map((option) => {
          const checked = selected === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-5 py-4 leading-snug transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                checked ? "border-accent bg-accent-soft" : "border-line bg-bg/70 backdrop-blur-sm hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={option.id}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="sr-only"
              />
              <span>{option.text}</span>
              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
                  checked ? "border-accent bg-accent" : "border-line"
                }`}
              >
                {checked && <span className="size-2 rounded-full bg-accent-ink" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
