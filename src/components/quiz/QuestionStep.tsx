import type { RefObject } from "react";
import type { Option, Question } from "@/lib/schema";
import { IconeCheck } from "@/components/ui/Icon";

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
    <fieldset className="animate-surgir">
      <legend className="contents">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">
          {question.text}
        </h1>
      </legend>
      <p className="mt-3 text-sm leading-relaxed text-muted">{question.context}</p>
      <div className="mt-8 space-y-3">
        {options.map((option) => {
          const checked = selected === option.id;
          return (
            <label
              key={option.id}
              className={`group flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border px-5 py-4 leading-snug shadow-sm transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring ${
                checked
                  ? "border-accent bg-accent-soft ring-1 ring-accent"
                  : "border-line-strong bg-surface/90 hover:border-ink/25 hover:bg-surface"
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
              <span className={checked ? "font-medium" : ""}>{option.text}</span>
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-150 ${
                  checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong group-hover:border-ink/30"
                }`}
              >
                {checked && <IconeCheck tamanho={14} strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
