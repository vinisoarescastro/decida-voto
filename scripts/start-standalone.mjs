// Inicia o servidor de produção gerado por `next build` (output: "standalone").
// Copia os arquivos estáticos para dentro da pasta standalone, como recomenda a documentação do Next.
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = new URL("..", import.meta.url);
const standalone = new URL(".next/standalone/", raiz);
if (!existsSync(standalone)) {
  console.error("Build não encontrado. Rode `npm run build` antes.");
  process.exit(1);
}
cpSync(new URL("public/", raiz), new URL("public/", standalone), { recursive: true });
cpSync(new URL(".next/static/", raiz), new URL(".next/static/", standalone), { recursive: true });

const servidor = spawn(process.execPath, [fileURLToPath(new URL("server.js", standalone))], {
  stdio: "inherit",
  env: process.env,
});
servidor.on("exit", (code) => process.exit(code ?? 0));
for (const sinal of ["SIGINT", "SIGTERM"]) process.on(sinal, () => servidor.kill(sinal));
