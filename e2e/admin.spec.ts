import { readFileSync } from "node:fs";
import { expect, request as novoContexto, test } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { E2E } from "../playwright.config";
import * as schema from "../src/server/db/schema";
import { registrarParticipacao } from "../src/server/services/participacoes";
import { base, entrada } from "../src/server/test/fixtures";

test.describe.configure({ mode: "serial" });

async function entrar(page: import("@playwright/test").Page, usuario = E2E.adminUsuario, senha = E2E.adminSenha) {
  await page.goto("/admin/login/");
  await page.getByLabel("Usuário").fill(usuario);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("sem sessão, o painel redireciona para o login", async ({ page }) => {
  await page.goto("/admin/");
  await expect(page).toHaveURL(/\/admin\/login\/$/);
  await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
});

test("cookie forjado não dá acesso", async ({ page, context }) => {
  await context.addCookies([{ name: "dv_admin", value: "forjado", url: E2E.baseURL }]);
  await page.goto("/admin/");
  await expect(page).toHaveURL(/\/admin\/login\/$/);
});

test("senha errada mostra erro genérico", async ({ page }) => {
  await entrar(page, E2E.adminUsuario, "senha-errada");
  await expect(page.getByRole("alert").filter({ hasText: "Usuário ou senha inválidos." })).toBeVisible();
});

test("bloqueia tentativas repetidas de login (força bruta)", async () => {
  const api = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: E2E.baseURL, "X-Real-IP": "192.0.2.50" } });
  const status = [];
  for (let i = 0; i < 11; i++) status.push((await api.post("/api/admin/login/", { data: { usuario: "atacante", senha: `tentativa-${i}` } })).status());
  expect(status.slice(0, 10).every((s) => s === 401)).toBe(true);
  expect(status[10]).toBe(429);
  // Mesmo com a senha certa, o IP bloqueado continua bloqueado durante a janela.
  expect((await api.post("/api/admin/login/", { data: { usuario: E2E.adminUsuario, senha: E2E.adminSenha } })).status()).toBe(429);
});

test("painel mostra só estatísticas agregadas e oculta grupos pequenos", async ({ page, context }) => {
  // Dados próprios do teste: 6 participações em SP (visível) e 1 em BA (grupo pequeno, oculto).
  const cliente = postgres(E2E.databaseUrl, { max: 1, onnotice: () => {} });
  const db = drizzle(cliente, { schema });
  for (let i = 0; i < 6; i++) await registrarParticipacao(db, entrada({ uf: "SP", municipio: 3550308, genero: "homem", idade: 33 }, 1), base);
  await registrarParticipacao(db, entrada({ uf: "BA", municipio: 2927408, genero: "mulher", idade: 70 }, 4), base);
  await cliente.end();

  await entrar(page);
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  const sessao = (await context.cookies()).find((c) => c.name === "dv_admin");
  expect(sessao).toMatchObject({ httpOnly: true, sameSite: "Strict" });

  await expect(page.getByText("Participações", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Por estado" })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: "São Paulo" }).first()).toBeVisible();
  await expect(page.getByText(/grupos? ocultos? por ter menos de 5 participações/).first()).toBeVisible();
  await expect(page.getByText("Uso interno.", { exact: true })).toBeVisible();
  await expect(page.getByText("Salvador")).toHaveCount(0);

  // Filtro com poucos participantes: nada é exibido.
  await page.goto("/admin/?uf=BA");
  await expect(page.getByText(/menos de 5 participações/)).toBeVisible();
  // Parâmetros inválidos são ignorados, sem erro.
  await page.goto("/admin/?uf=XX&genero=%27%3B%20drop%20table&faixa=99");
  await expect(page.getByRole("heading", { name: "Por estado" })).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/admin\/login\/$/);
  await page.goto("/admin/");
  await expect(page).toHaveURL(/\/admin\/login\/$/);
});

test("painel altera o responsável pelos dados, e as páginas públicas mostram na hora", async ({ page }) => {
  // Sem configuração, Privacidade não mostra o bloco de contato.
  await page.goto("/privacidade/");
  await expect(page.getByRole("heading", { name: "Responsável e contato" })).toHaveCount(0);

  await entrar(page);
  const nome = page.getByLabel("Nome do responsável");
  const email = page.getByLabel("E-mail de contato");
  await expect(nome).toHaveValue("");

  await nome.fill("Pessoa Responsável de Teste");
  await email.fill("sem-arroba");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");

  await email.fill("  Contato@Example.ORG ");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Salvo." })).toBeVisible();
  await expect(email).toHaveValue("contato@example.org");

  // Persiste após recarregar o painel.
  await page.reload();
  await expect(page.getByLabel("Nome do responsável")).toHaveValue("Pessoa Responsável de Teste");

  await page.goto("/privacidade/");
  await expect(page.getByText("Responsável pelo tratamento dos dados: Pessoa Responsável de Teste.")).toBeVisible();
  await expect(page.getByRole("link", { name: "contato@example.org" })).toHaveAttribute("href", "mailto:contato@example.org");
  await page.goto("/metodologia/");
  await expect(page.getByRole("link", { name: "contato@example.org" })).toBeVisible();
});

test("API do responsável exige sessão e origem do próprio site", async () => {
  const dados = { nome: "Invasor", email: "invasor@example.org" };
  const semSessao = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: E2E.baseURL } });
  expect((await semSessao.post("/api/admin/responsavel/", { data: dados })).status()).toBe(401);
  const outraOrigem = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: "https://malicioso.example" } });
  expect((await outraOrigem.post("/api/admin/responsavel/", { data: dados })).status()).toBe(403);
});

test("aba de revisão salva rascunho, exporta os arquivos e não altera o site público", async ({ page }) => {
  await entrar(page);
  await page.getByRole("link", { name: "Revisão de conteúdo" }).click();
  await expect(page.getByRole("heading", { name: "Revisão de conteúdo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Revisão de conteúdo" })).toHaveAttribute("aria-current", "page");

  const cartao = page.locator("#pergunta-estatais");
  await cartao.locator(":scope > summary").click();

  // Erro de validação aparece no campo.
  const pergunta = cartao.getByLabel("Pergunta", { exact: true });
  await pergunta.fill("");
  await cartao.getByRole("button", { name: "Salvar" }).click();
  await expect(cartao.getByText("Escreva a pergunta.")).toBeVisible();

  await pergunta.fill("O que o governo deve fazer com as empresas públicas?");
  await expect(cartao.getByText("Alterado.").first()).toBeVisible();
  const alternativa2 = cartao.locator("div.rounded-2xl").filter({ has: page.getByLabel("Alternativa 2", { exact: true }) });
  await alternativa2.getByRole("radio", { name: "Lula" }).check();
  await expect(cartao.getByText("Publicado: alternativa 1.")).toBeVisible();
  await cartao.getByRole("checkbox", { name: /Pergunta revisada/ }).check();
  await cartao.getByLabel("Nota da revisão").fill("Teste automatizado.");
  await cartao.getByRole("button", { name: "Salvar" }).click();
  await expect(cartao.getByRole("status").filter({ hasText: "Rascunho salvo." })).toBeVisible();

  // Persiste após recarregar.
  await page.reload();
  await expect(page.getByText("Revisadas").locator("..")).toContainText("1 de 10");
  await expect(cartao.getByText("Revisada", { exact: true })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Baixar positions.json" }).click();
  const arquivo = JSON.parse(readFileSync(await (await download).path(), "utf8"));
  expect(arquivo.reviewStatus).toBe("pendente");
  expect(arquivo.positions.find((p: { questionId: string; candidateId: string }) => p.questionId === "estatais" && p.candidateId === "lula").value).toBe(2);

  // O site público continua com o conteúdo publicado.
  const publica = await page.request.get("/metodologia/");
  expect(await publica.text()).toContain("O que fazer com as empresas do governo?");

  page.once("dialog", (d) => d.accept());
  await expect(cartao.locator(":scope > summary")).toContainText("O que o governo deve fazer com as empresas públicas?");
  await cartao.locator(":scope > summary").click();
  await cartao.getByRole("button", { name: "Descartar rascunho" }).click();
  await expect(cartao.getByRole("status").filter({ hasText: "Rascunho descartado." })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Revisadas").locator("..")).toContainText("0 de 10");
});

test("API da revisão exige sessão e origem do próprio site", async () => {
  const dados = { perguntaId: "estatais", rascunho: {} };
  const semSessao = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: E2E.baseURL } });
  expect((await semSessao.post("/api/admin/revisao/", { data: dados })).status()).toBe(401);
  expect((await semSessao.delete("/api/admin/revisao/?pergunta=estatais")).status()).toBe(401);
  expect((await semSessao.get("/api/admin/revisao/exportar/?arquivo=posicoes")).status()).toBe(401);
  const outraOrigem = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: "https://malicioso.example" } });
  expect((await outraOrigem.post("/api/admin/revisao/", { data: dados })).status()).toBe(403);
});
