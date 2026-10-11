import { describe, expect, it } from "vitest";
import type { Dia } from "@/server/services/analises";
import { acumulado, mediaMovel, preencherDias } from "./series";

const dia = (d: string, n: number, pontosA: number | null): Dia => ({ dia: d, n, pontosA, porOrigem: { convite: 0, panfleto: 0, stories: 0 } });

describe("preencherDias", () => {
  it("completa os dias sem envio com zero, inclusive na virada do mês", () => {
    const r = preencherDias([dia("2026-09-29", 2, 60), dia("2026-10-02", 1, 40)]);
    expect(r.map((d) => d.dia)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
    expect(r.map((d) => d.n)).toEqual([2, 0, 0, 1]);
    expect(r[1].pontosA).toBeNull();
  });

  it("sem dias, devolve vazio", () => {
    expect(preencherDias([])).toEqual([]);
  });
});

describe("acumulado", () => {
  it("soma dia a dia", () => {
    expect(acumulado([2, 0, 3, 1])).toEqual([2, 2, 5, 6]);
  });
});

describe("mediaMovel", () => {
  it("pondera pelas participações e ignora dias vazios", () => {
    const r = mediaMovel([dia("2026-10-01", 3, 60), dia("2026-10-02", 0, null), dia("2026-10-03", 1, 20)], 7);
    expect(r[0]).toBeCloseTo(60);
    expect(r[1]).toBeCloseTo(60);
    expect(r[2]).toBeCloseTo((3 * 60 + 20) / 4);
  });

  it("só olha a janela pedida", () => {
    const r = mediaMovel([dia("2026-10-01", 1, 100), dia("2026-10-02", 1, 50), dia("2026-10-03", 1, 0)], 2);
    expect(r).toEqual([100, 75, 25]);
  });

  it("janela sem nenhuma participação: null", () => {
    expect(mediaMovel([dia("2026-10-01", 0, null)])).toEqual([null]);
  });
});
