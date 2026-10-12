import { expect, request as novoContexto, test, type Browser, type Page } from "@playwright/test";
import postgres from "postgres";
import { E2E } from "../playwright.config";

// Níveis de acesso do painel: master cria a pessoa com senha provisória; a pessoa troca a senha no primeiro
// acesso; o admin só visualiza (a tela não oferece alteração e o servidor recusa); o master reseta a senha.

test.describe.configure({ mode: "serial" });

const LEITORA = { nome: "Leitora de Teste", usuario: "leitora", email: "leitora@exemplo.org" };
const NOVA_SENHA = "frase longa da leitora 2026";
let provisoria = "";

// Cada pessoa usa um IP próprio, para o limite de tentativas de login não somar entre os testes.
async function contexto(browser: Browser, ip: string) {
  return browser.newContext({ extraHTTPHeaders: { "X-Real-IP": ip } });
}

async function entrar(page: Page, usuario: string, senha: string) {
  await page.goto("/admin/login/");
  await page.getByLabel("Usuário ou e-mail").fill(usuario);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.beforeAll(async () => {
  const sql = postgres(E2E.databaseUrl, { max: 1, onnotice: () => {} });
  await sql`truncate limites_requisicao`;
  await sql`delete from admin_usuarios where usuario = ${LEITORA.usuario}`;
  await sql.end();
});

test("master cria uma pessoa com nível admin e recebe a senha provisória uma única vez", async ({ browser }) => {
  const ctx = await contexto(browser, "192.0.2.71");
  const page = await ctx.newPage();
  await entrar(page, E2E.adminUsuario, E2E.adminSenha);
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  await expect(page.getByText("Master", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Usuários" }).click();
  await page.getByRole("button", { name: "Adicionar usuário" }).click();
  const dialogo = page.getByRole("dialog", { name: "Adicionar usuário" });
  await dialogo.getByLabel("Nome").fill(LEITORA.nome);
  await dialogo.getByLabel("Usuário", { exact: true }).fill(LEITORA.usuario);
  await dialogo.getByLabel("E-mail (opcional)").fill(LEITORA.email);
  await dialogo.getByText("Admin", { exact: true }).click();
  await dialogo.getByRole("button", { name: "Criar usuário" }).click();

  const senha = page.getByRole("dialog", { name: "Senha provisória" }).getByLabel("Senha provisória");
  await expect(senha).toBeVisible();
  provisoria = (await senha.textContent())!.trim();
  expect(provisoria).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
  await page.getByRole("button", { name: "Concluir" }).click();

  const linha = page.getByRole("row").filter({ hasText: LEITORA.nome });
  await expect(linha).toContainText("Aguardando primeiro acesso");
  await expect(linha).toContainText("Nunca entrou");
  await ctx.close();
});

test("no primeiro acesso (pelo e-mail), a pessoa precisa trocar a senha provisória", async ({ browser }) => {
  const ctx = await contexto(browser, "192.0.2.72");
  const page = await ctx.newPage();
  await entrar(page, LEITORA.email, provisoria);
  await expect(page).toHaveURL(/\/admin\/nova-senha\/$/);
  await expect(page.getByRole("heading", { name: "Defina sua nova senha" })).toBeVisible();

  // Enquanto não troca, o painel e as APIs ficam bloqueados.
  await page.goto("/admin/");
  await expect(page).toHaveURL(/\/admin\/nova-senha\/$/);
  expect((await page.request.get("/api/admin/revisao/exportar/?arquivo=perguntas")).status()).toBe(403);

  await page.getByLabel("Senha provisória").fill(provisoria);
  await page.getByLabel("Nova senha", { exact: true }).fill("curta");
  await page.getByLabel("Repita a nova senha").fill("curta");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText(/Use pelo menos 12 caracteres/)).toBeVisible();

  await page.getByLabel("Nova senha", { exact: true }).fill(NOVA_SENHA);
  await page.getByLabel("Repita a nova senha").fill(NOVA_SENHA);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText("Senha alterada.")).toBeVisible();
  await page.getByRole("button", { name: "Ir para o painel" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  await ctx.close();
});

test("admin só visualiza: a tela não oferece alteração e o servidor recusa", async ({ browser }) => {
  const ctx = await contexto(browser, "192.0.2.73");
  const page = await ctx.newPage();
  await entrar(page, LEITORA.usuario, NOVA_SENHA);
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  await expect(page.getByText("Acesso de visualização.")).toBeVisible();
  await expect(page.getByLabel("Nome do responsável")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Salvar" })).toHaveCount(0);

  await page.getByRole("link", { name: "Revisão de conteúdo" }).click();
  await page.locator("details summary").first().click();
  await expect(page.locator("details").first().locator("textarea").first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Salvar" })).toHaveCount(0);

  await page.getByRole("link", { name: "Usuários" }).click();
  await expect(page.getByRole("row").filter({ hasText: LEITORA.nome })).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar usuário" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Editar/ })).toHaveCount(0);

  // Mesmo forçando a requisição com a sessão da admin, nada é gravado.
  const cabecalhos = { Origin: E2E.baseURL };
  expect((await page.request.post("/api/admin/responsavel/", { headers: cabecalhos, data: { nome: "Invasor", email: "x@exemplo.org" } })).status()).toBe(403);
  expect((await page.request.post("/api/admin/usuarios/", { headers: cabecalhos, data: { nome: "Outro", usuario: "outro", email: "", papel: "master" } })).status()).toBe(403);
  expect((await page.request.delete("/api/admin/revisao/?pergunta=x", { headers: cabecalhos })).status()).toBe(403);

  // Exportar é leitura: liberado.
  expect((await page.request.get("/api/admin/revisao/exportar/?arquivo=perguntas")).status()).toBe(200);
  await ctx.close();
});

test("master vê a auditoria e o último acesso, e reseta a senha (a anterior deixa de valer)", async ({ browser }) => {
  const ctx = await contexto(browser, "192.0.2.74");
  const page = await ctx.newPage();
  await entrar(page, E2E.adminUsuario, E2E.adminSenha);
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();

  await page.getByRole("link", { name: "Auditoria" }).click();
  const leitora = page.getByRole("row").filter({ hasText: LEITORA.usuario });
  await expect(leitora.filter({ hasText: "Entrou no painel" }).first()).toBeVisible();
  await expect(leitora.filter({ hasText: "Trocou a própria senha" }).first()).toBeVisible();
  await expect(leitora.filter({ hasText: "Visualizou · Revisão de conteúdo" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Usuários" }).click();
  const linha = page.getByRole("row").filter({ hasText: LEITORA.nome });
  await expect(linha).toContainText("Ativo");
  await expect(linha).not.toContainText("Nunca entrou");
  await linha.getByRole("button", { name: `Resetar a senha de ${LEITORA.nome}` }).click();
  await page.getByRole("button", { name: "Gerar nova senha" }).click();
  const nova = (await page.getByRole("dialog", { name: "Senha provisória" }).getByLabel("Senha provisória").textContent())!.trim();
  expect(nova).not.toBe(provisoria);
  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(linha).toContainText("Aguardando primeiro acesso");

  // O master não consegue rebaixar a si mesmo (nível bloqueado na própria conta).
  await page.getByRole("row").filter({ hasText: "(você)" }).getByRole("button", { name: /^Editar/ }).click();
  await expect(page.getByRole("dialog", { name: "Editar usuário" }).getByRole("radio", { name: /Admin/ })).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await ctx.close();

  const api = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: E2E.baseURL, "X-Real-IP": "192.0.2.75" } });
  expect((await api.post("/api/admin/login/", { data: { usuario: LEITORA.usuario, senha: NOVA_SENHA } })).status()).toBe(401);
  expect((await api.post("/api/admin/login/", { data: { usuario: LEITORA.usuario, senha: nova } })).status()).toBe(200);
  await api.dispose();
});
