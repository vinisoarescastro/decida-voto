// Verifica se todos os links de fontes e notícias respondem (uso: npm run check:links).
// Não substitui a revisão humana: confirma apenas que a página existe, não o conteúdo.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const dataDir = join(import.meta.dirname, "..", "src", "data");
const positions = JSON.parse(await readFile(join(dataDir, "positions.json"), "utf8"));
const news = JSON.parse(await readFile(join(dataDir, "news.json"), "utf8"));

const urls = new Map();
for (const p of positions.positions) for (const e of p.evidence) urls.set(e.url, `posição ${p.questionId}/${p.candidateId}`);
for (const n of news.items) urls.set(n.url, `notícia ${n.questionId}`);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
      if (res.ok) return { ok: true, status: res.status };
      if (method === "GET") return { ok: false, status: res.status };
    } catch (err) {
      if (method === "GET") return { ok: false, status: err.name === "TimeoutError" ? "timeout" : err.message };
    }
  }
}

const entries = [...urls.entries()];
const results = [];
const CONCURRENCY = 6;
for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const batch = entries.slice(i, i + CONCURRENCY);
  results.push(...(await Promise.all(batch.map(async ([url, where]) => ({ url, where, ...(await check(url)) })))));
}

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} links responderam com sucesso.`);
for (const f of failed) console.log(`FALHA [${f.status}] ${f.where}: ${f.url}`);
// 401/403/429 costumam ser bloqueio a robôs, não link quebrado: confira no navegador.
process.exitCode = failed.some((f) => ![401, 403, 429].includes(f.status)) ? 1 : 0;
