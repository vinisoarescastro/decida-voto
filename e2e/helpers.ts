import { expect, type Page } from "@playwright/test";
import postgres from "postgres";
import { E2E } from "../playwright.config";

export const opcao = (page: Page, n: number) => page.locator('label:has(input[name^="q-"])').nth(n);

export async function preencherPerfil(page: Page, { uf = "SP", cidade = "São Paulo", genero = "Mulher", idade = "30" } = {}) {
  await page.getByLabel("Estado", { exact: true }).selectOption(uf);
  const cidadeSelect = page.getByLabel("Cidade", { exact: true });
  await expect(cidadeSelect).toBeEnabled();
  await cidadeSelect.selectOption({ label: cidade });
  await page.getByText(genero, { exact: true }).click();
  await page.getByLabel("Idade", { exact: true }).fill(idade);
}

export async function responderTudo(page: Page) {
  await expect(page.getByText("1 / 10")).toBeVisible();
  // O servidor recusa envios mais rápidos que FORM_MIN_SECONDS (1 s nos testes) como comportamento de robô.
  await page.waitForTimeout(1100);
  for (let i = 0; i < 10; i++) {
    await opcao(page, i % 4).click();
    await page.getByRole("button", { name: /Próxima|Ver resultado/ }).click();
  }
}

export async function contarParticipacoes(): Promise<number> {
  const sql = postgres(E2E.databaseUrl, { max: 1, onnotice: () => {} });
  try {
    const [{ n }] = await sql`select count(*)::int as n from participacoes`;
    return n;
  } finally {
    await sql.end();
  }
}
