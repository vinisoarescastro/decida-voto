// Gera o hash da senha do painel para a variável ADMIN_PASSWORD_HASH do .env.
// Uso: npm run admin:hash   (a senha é digitada sem aparecer na tela e nunca é gravada)
import { createInterface } from "node:readline";
import { gerarHashSenha } from "../src/server/security/crypto.ts";

async function lerSenha(pergunta) {
  if (!process.stdin.isTTY) {
    let entrada = "";
    for await (const parte of process.stdin) entrada += parte;
    return entrada.replace(/\r?\n$/, "");
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => rl.output.write(s.startsWith(pergunta) ? s : "");
  const senha = await new Promise((resolve) => rl.question(pergunta, resolve));
  rl.close();
  process.stdout.write("\n");
  return senha;
}

const senha = await lerSenha("Nova senha do painel (mín. 12 caracteres): ");
if (senha.length < 12) {
  console.error("A senha precisa ter pelo menos 12 caracteres.");
  process.exit(1);
}
console.log(await gerarHashSenha(senha));
