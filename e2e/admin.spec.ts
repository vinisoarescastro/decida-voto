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
