import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { opcao, preencherPerfil } from "./helpers";

// Varredura automática de acessibilidade (WCAG 2.1 A/AA) nas telas principais.
// Falha se houver violações de impacto sério ou crítico.

async function verificar(page: Page, tela: string) {
  // Espera as animações finitas terminarem: no meio de uma entrada, o texto ainda está semitransparente.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((anim) => anim.effect?.getTiming().iterations !== Infinity)
        .map((anim) => anim.finished.catch(() => undefined)),
    ),
  );
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    graves.flatMap((v) => v.nodes.map((n) => `${tela}: ${v.id} em ${n.target.join(" ")} — ${n.any.map((x) => x.message).join(" ")}`)),
  ).toEqual([]);
}

test("telas públicas sem violações graves de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await verificar(page, "início");

  await page.goto("/questionario/");
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await verificar(page, "perfil com erros");

  await preencherPerfil(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 1 de 10")).toBeVisible();
  await opcao(page, 1).click();
  await verificar(page, "pergunta");

  for (const caminho of ["/metodologia/", "/privacidade/", "/admin/login/"]) {
    await page.goto(caminho);
    await verificar(page, caminho);
  }
});

test.describe("preferência por menos movimento", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("desliga as animações quando o sistema pede menos movimento", async ({ page }) => {
    await page.goto("/questionario/");
    await page.getByRole("button", { name: "Continuar" }).click();
    const erro = page.locator("p", { hasText: "Selecione seu estado." });
    await expect(erro).toBeVisible();
    expect(await erro.evaluate((el) => [getComputedStyle(el).animationName, getComputedStyle(el).opacity])).toEqual(["none", "1"]);
  });
});
