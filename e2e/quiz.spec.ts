import { expect, test } from "@playwright/test";
import { opcao, preencherPerfil, responderTudo } from "./helpers";

test("fluxo completo: perfil, questionário, resultado e registro da participação", async ({ page, baseURL, context }) => {
  const requests: { method: string; url: string }[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("request", (r) => requests.push({ method: r.method(), url: r.url() }));

  await page.goto("/");
  await page.getByRole("link", { name: "Começar questionário" }).click();
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();

  // Validação no navegador: mensagens claras para cada campo.
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Selecione seu estado.")).toBeVisible();
  await expect(page.getByText("Informe sua idade.")).toBeVisible();
  // Sem caixa de seleção: o aviso de ciência fica junto ao botão, com links para os termos e a privacidade.
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText(/Ao clicar em “Continuar”, você declara estar ciente e de acordo/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Termos de uso" })).toHaveAttribute("href", "/privacidade/#termos");
  await expect(page.getByRole("link", { name: "Política de privacidade" })).toHaveAttribute("href", "/privacidade/");
  for (const [valor, mensagem] of [
    ["abc", "Use apenas números inteiros"],
    ["30.5", "Use apenas números inteiros"],
    ["-5", "Use apenas números inteiros"],
    ["15", "A idade mínima para participar é 16 anos."],
    ["121", "Informe uma idade de até 120 anos."],
  ]) {
    await page.getByLabel("Idade", { exact: true }).fill(valor);
    await page.getByLabel("Idade", { exact: true }).blur();
    await expect(page.getByText(mensagem)).toBeVisible();
  }

  await preencherPerfil(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  const envio = page.waitForResponse((r) => r.url().endsWith("/api/participacoes/"));
  await responderTudo(page);
  const resposta = await envio;
  expect(resposta.status()).toBe(201);

  await expect(page.getByRole("heading", { name: "Seu resultado", exact: true })).toBeVisible();
  await expect(page.getByText(/Baseado em \d+ de 10 temas/)).toBeVisible();
  await expect(page.getByText("Sua participação foi registrada, sem identificação pessoal.")).toBeVisible();

  // Só o próprio site é chamado; os únicos envios são o token e a participação.
  const origin = new URL(baseURL!).origin;
  expect(requests.filter((r) => !r.url.startsWith(origin))).toEqual([]);
  expect(requests.filter((r) => r.method === "POST").map((r) => new URL(r.url).pathname)).toEqual(["/api/token/", "/api/participacoes/"]);
  expect(consoleErrors).toEqual([]);

  // Nada no armazenamento do navegador; o cookie anti-repetição é HttpOnly e não identifica a pessoa.
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }))).toEqual({
    local: 0,
    session: 0,
    cookie: "",
  });
  const cookie = (await context.cookies()).find((c) => c.name === "dv_participou");
  expect(cookie).toMatchObject({ value: "1", httpOnly: true, sameSite: "Strict" });

  // Refazer no mesmo dispositivo: o resultado aparece, mas a participação não é contada de novo.
  await page.getByRole("button", { name: "Refazer questionário" }).click();
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await expect(page.getByLabel("Idade", { exact: true })).toHaveValue("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await responderTudo(page);
  await expect(page.getByText("Este dispositivo já participou recentemente.", { exact: false })).toBeVisible();
});

test("permite voltar e manter respostas", async ({ page }) => {
  await page.goto("/questionario/");
  await preencherPerfil(page, { uf: "RJ", cidade: "Niterói", genero: "Homem", idade: "45" });
  await page.getByRole("button", { name: "Continuar" }).click();
  await opcao(page, 2).click();
  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page.getByText("2 / 10")).toBeVisible();
  await page.getByRole("button", { name: "Anterior" }).click();
  await expect(page.getByRole("radio").nth(2)).toBeChecked();
});

test("sorteia a ordem das alternativas a cada abertura", async ({ page }) => {
  const orders = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.goto("/questionario/");
    await preencherPerfil(page, { uf: "DF", cidade: "Brasília" });
    await page.getByRole("button", { name: "Continuar" }).click();
    const labels = page.locator('label:has(input[name^="q-"])');
    await expect(labels).toHaveCount(4);
    orders.add((await labels.allInnerTexts()).join("|"));
  }
  expect(orders.size).toBeGreaterThan(1);
});

test("páginas institucionais carregam", async ({ page }) => {
  for (const path of ["/metodologia/", "/privacidade/"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
