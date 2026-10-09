import { expect, request as novoContexto, test } from "@playwright/test";
import { questions } from "../src/lib/data";
import { E2E } from "../playwright.config";
import { contarParticipacoes } from "./helpers";

// Proteções do backend testadas diretamente na API (sem passar pela interface).

const ORIGEM = { Origin: E2E.baseURL };
const respostas = Object.fromEntries(questions.map((q) => [q.id, q.options[0].id]));
const perfil = { uf: "SP", municipio: 3550308, genero: "homem", idade: 40 };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function contexto(ip: string) {
  return novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { ...ORIGEM, "X-Real-IP": ip } });
}

async function novoToken(api: Awaited<ReturnType<typeof contexto>>) {
  const r = await api.post("/api/token/");
  expect(r.status()).toBe(200);
  return (await r.json()).token as string;
}

test("recusa requisições de outra origem", async () => {
  const api = await novoContexto.newContext({ baseURL: E2E.baseURL, extraHTTPHeaders: { Origin: "https://site-malicioso.example" } });
  expect((await api.post("/api/token/")).status()).toBe(403);
  expect((await api.post("/api/participacoes/", { data: {} })).status()).toBe(403);
  expect((await api.post("/api/admin/login/", { data: { usuario: "x", senha: "y" } })).status()).toBe(403);
});

test("valida a idade também no backend", async () => {
  const api = await contexto("198.51.100.10");
  const token = await novoToken(api);
  await esperar(1200);
  for (const idade of [15, 121, -1, 30.5, "30", "abc"]) {
    const r = await api.post("/api/participacoes/", { data: { perfil: { ...perfil, idade }, respostas, consentimento: true, token, site: "" } });
    expect(r.status(), `idade ${JSON.stringify(idade)}`).toBe(400);
  }
});

test("recusa sem consentimento, município de outra UF e campos extras", async () => {
  const api = await contexto("198.51.100.11");
  const token = await novoToken(api);
  await esperar(1200);
  const base = { perfil, respostas, consentimento: true, token, site: "" };
  expect((await api.post("/api/participacoes/", { data: { ...base, consentimento: false } })).status()).toBe(400);
  expect((await api.post("/api/participacoes/", { data: { ...base, perfil: { ...perfil, uf: "RJ" } } })).status()).toBe(400);
  expect((await api.post("/api/participacoes/", { data: { ...base, resultado: { lula: 100 } } })).status()).toBe(400);
});

test("recusa envio rápido demais, token adulterado e reutilização do token", async () => {
  const api = await contexto("198.51.100.12");
  const rapido = await novoToken(api);
  expect((await api.post("/api/participacoes/", { data: { perfil, respostas, consentimento: true, token: rapido, site: "" } })).status()).toBe(400);

  const token = await novoToken(api);
  await esperar(1200);
  const adulterado = token.slice(0, -2) + (token.endsWith("A") ? "BB" : "AA");
  expect((await api.post("/api/participacoes/", { data: { perfil, respostas, consentimento: true, token: adulterado, site: "" } })).status()).toBe(400);

  const antes = await contarParticipacoes();
  expect((await api.post("/api/participacoes/", { data: { perfil, respostas, consentimento: true, token, site: "" } })).status()).toBe(201);
  // Outro "dispositivo" (sem o cookie) tentando reaproveitar o mesmo token.
  const outro = await contexto("198.51.100.13");
  expect((await outro.post("/api/participacoes/", { data: { perfil, respostas, consentimento: true, token, site: "" } })).status()).toBe(409);
  expect(await contarParticipacoes()).toBe(antes + 1);
});

test("campo-isca preenchido: responde como sucesso, mas não grava", async () => {
  const api = await contexto("198.51.100.14");
  const token = await novoToken(api);
  await esperar(1200);
  const antes = await contarParticipacoes();
  const r = await api.post("/api/participacoes/", { data: { perfil, respostas, consentimento: true, token, site: "http://spam.example" } });
  expect(r.status()).toBe(201);
  expect(await contarParticipacoes()).toBe(antes);
});

test("limita envios por rede (IP)", async () => {
  const api = await contexto("198.51.100.15");
  const tokens = [];
  for (let i = 0; i < 11; i++) tokens.push(await novoToken(api));
  await esperar(1200);
  const status = [];
  for (const token of tokens) {
    // Cada envio em um "dispositivo" novo, para isolar o limite por IP do bloqueio por cookie.
    const dispositivo = await contexto("198.51.100.15");
    status.push((await dispositivo.post("/api/participacoes/", { data: { perfil, respostas, consentimento: true, token, site: "" } })).status());
  }
  expect(status.slice(0, 10).every((s) => s === 201)).toBe(true);
  expect(status[10]).toBe(429);
});
