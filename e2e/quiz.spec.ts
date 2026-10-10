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
  expect((await envio).status()).toBe(201);

  await expect(page.getByRole("heading", { name: "Seu resultado", exact: true })).toBeVisible();
  await expect(page.getByText(/^Suas respostas ficaram/)).toBeVisible();
  await expect(page.getByText(/Baseado em \d+ de 10 temas/)).toBeVisible();
  await expect(page.getByText("Sua participação foi registrada, sem identificação pessoal.")).toBeVisible();

  // Detalhes ficam fechados até a pessoa pedir.
  await expect(page.getByText("Concordância absoluta.")).toHaveCount(0);
  await page.getByRole("button", { name: /Detalhes por tema/ }).click();
  await expect(page.getByRole("heading", { name: "Comparação tema a tema" })).toBeVisible();
  await page.getByRole("button", { name: /Como calculamos/ }).click();
  await expect(page.getByText("Concordância absoluta.")).toBeVisible();
  await page.getByRole("button", { name: /Notícias/ }).click();
  await expect(page.getByText(/mesmo critério para os dois candidatos/)).toBeVisible();

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

  // Sem rolagem horizontal na tela de resultado (com os painéis abertos).
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // Refazer no mesmo dispositivo: o resultado aparece, mas a participação não é contada de novo.
  await page.getByRole("button", { name: "Refazer questionário" }).click();
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await expect(page.getByLabel("Idade", { exact: true })).toHaveValue("30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await responderTudo(page);
  await expect(page.getByText("Este dispositivo já participou recentemente.", { exact: false })).toBeVisible();
});

test("botão Anterior e o 'voltar' do navegador retornam à pergunta anterior sem perder respostas", async ({ page }) => {
  await page.goto("/questionario/");
  await preencherPerfil(page, { uf: "RJ", cidade: "Niterói", genero: "Homem", idade: "45" });
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/passo=1$/);

  await opcao(page, 2).click();
  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page.getByText("Pergunta 2 de 10")).toBeVisible();
  await opcao(page, 0).click();

  // Botão da interface
  await page.getByRole("button", { name: "Anterior" }).click();
  await expect(page.getByText("Pergunta 1 de 10")).toBeVisible();
  await expect(page.getByRole("radio").nth(2)).toBeChecked();

  // Avançar e voltar pelo navegador (gesto de voltar do celular)
  await page.goForward();
  await expect(page.getByText("Pergunta 2 de 10")).toBeVisible();
  await expect(page.getByRole("radio").nth(0)).toBeChecked();
  await page.goBack();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await expect(page.getByLabel("Idade", { exact: true })).toHaveValue("45");

  // Continuar retoma da primeira pergunta sem resposta, sem pedir nova sessão.
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 3 de 10")).toBeVisible();
});

test("a barra de ações fixa não cobre o último campo nem a última alternativa", async ({ page }) => {
  // Distância entre o fim do elemento e o topo da barra, com a página rolada até o fim.
  const folga = (seletor: string) =>
    page.evaluate((sel) => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const botao = [...document.querySelectorAll("button")].find((b) => /^(Continuar|Próxima)/.test(b.textContent!.trim()))!;
      const barra = botao.closest(".fixed")!;
      const alvos = document.querySelectorAll(sel);
      return barra.getBoundingClientRect().top - alvos[alvos.length - 1].getBoundingClientRect().bottom;
    }, seletor);

  await page.goto("/questionario/");
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  expect(await folga("input[inputmode=numeric]")).toBeGreaterThanOrEqual(0);

  await preencherPerfil(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 1 de 10")).toBeVisible();
  expect(await folga('label:has(input[name^="q-"])')).toBeGreaterThanOrEqual(0);
});

test("não permite pular perguntas pelo endereço nem chegar ao resultado incompleto", async ({ page }) => {
  await page.goto("/questionario/?passo=7");
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await expect(page).not.toHaveURL(/passo=/);

  await preencherPerfil(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 1 de 10")).toBeVisible();
  await expect(page.getByRole("button", { name: "Próxima" })).toBeDisabled();
});

test("atalhos de teclado: 1–4 escolhem a alternativa e Enter avança", async ({ page }) => {
  await page.goto("/questionario/");
  await preencherPerfil(page, { uf: "DF", cidade: "Brasília" });
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 1 de 10")).toBeVisible();
  await page.keyboard.press("2");
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Pergunta 2 de 10")).toBeVisible();
});

test("sorteia a ordem das alternativas a cada abertura", async ({ page }) => {
  const ordens = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.goto("/questionario/");
    await preencherPerfil(page, { uf: "DF", cidade: "Brasília" });
    await page.getByRole("button", { name: "Continuar" }).click();
    const rotulos = page.locator('label:has(input[name^="q-"])');
    await expect(rotulos).toHaveCount(4);
    ordens.add((await rotulos.allInnerTexts()).join("|"));
  }
  expect(ordens.size).toBeGreaterThan(1);
});

test("páginas institucionais e 404 carregam sem rolagem horizontal", async ({ page }) => {
  for (const caminho of ["/", "/metodologia/", "/privacidade/", "/pagina-que-nao-existe/"]) {
    await page.goto(caminho);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  }
});
