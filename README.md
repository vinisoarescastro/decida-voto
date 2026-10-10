# Decida Voto

Ferramenta informativa e independente que compara as respostas do eleitor a 10 perguntas com as posições públicas documentadas dos candidatos ao 2º turno presidencial de 2026. Não é pesquisa eleitoral nem recomendação de voto.

## Arquitetura

- **Next.js 16 (App Router)** em modo servidor (`output: "standalone"`), executado em Docker atrás do Nginx. As páginas públicas continuam pré-renderizadas.
- **PostgreSQL 16** em Docker, sem porta exposta, com acesso via Drizzle ORM (consultas parametrizadas e migrações versionadas em `drizzle/`).
- **Coleta mínima de dados**, com consentimento: UF, município (lista do IBGE), gênero, faixa etária e respostas. A afinidade é recalculada no servidor. Não guardamos idade exata, IP, horário nem identificadores.
- **Responsável pelos dados (LGPD):** nome e e-mail de contato ficam no banco (tabela `configuracoes`) e são editados no painel. As páginas de Privacidade e Metodologia leem esses dados a cada acesso.
- **Painel `/admin`** com autenticação (senha com hash scrypt, sessão em cookie `HttpOnly`/`SameSite=Strict`, bloqueio de tentativas). Mostra só estatísticas agregadas e oculta grupos com menos de `PRIVACY_MIN_GROUP` participações.
- **Antiabuso:**
  - token assinado e de uso único;
  - tempo mínimo de preenchimento;
  - campo-isca contra robôs;
  - limite de envios por hash diário de IP;
  - cookie que impede repetir o envio por 30 dias;
  - verificação de origem e limites no Nginx.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/data/` | Perguntas, posições, notícias e municípios do IBGE |
| `src/lib/affinity.ts` | Cálculo de afinidade (função pura, usada no navegador e no servidor) |
| `src/lib/perfil.ts`, `participacao-schema.ts` | Regras do perfil (idade de 16 a 120, faixas) e validação do envio |
| `src/server/db/` | Esquema do banco e conexão |
| `src/server/services/` | Gravação de participações, estatísticas, sessões e tokens |
| `src/server/security/` | Criptografia (hashes, tokens, senha) e limite de requisições |
| `src/app/api/` | Rotas: municípios, token, participações, login e logout |
| `src/app/` | Páginas (início, questionário, metodologia, privacidade, admin, 404) |
| `src/components/ui/`, `src/components/layout/` | Peças de interface reutilizáveis (botões, campos, ícones, cabeçalho, rodapé) |
| `src/features/quiz/` | Fluxo do questionário: perfil, uma pergunta por tela, barra de ações e estado na URL (`?passo=`) |
| `src/features/result/` | Tela de resultado: gráfico, detalhes por tema, cálculo e notícias |
| `src/features/admin/` | Filtros, grupos, login e saída do painel |
| `drizzle/` | Migrações SQL, incluindo a carga dos 5.571 municípios |
| `deploy/` | Nginx, backup e roteiro de implantação ([deploy/README.md](deploy/README.md)) |

## Desenvolvimento local

```bash
npm install
npm run db:dev:up                  # PostgreSQL de desenvolvimento em Docker (127.0.0.1:55433, dados persistentes)
DATABASE_URL=postgres://postgres:dev@127.0.0.1:55433/decida_voto npm run db:migrate
cp .env.example .env               # preencha (veja abaixo)
npm run dev                        # http://localhost:3000
```

No `.env` de desenvolvimento, use:

- `DATABASE_URL=postgres://postgres:dev@127.0.0.1:55433/decida_voto`
- `APP_ORIGIN=http://localhost:3000`
- `FORM_TOKEN_SECRET` e `RATE_LIMIT_SECRET` com valores aleatórios (`openssl rand -hex 32`)
- `ADMIN_USERNAME` e `ADMIN_PASSWORD_HASH` (gere com `npm run admin:hash`)

Acesse sempre por `http://localhost:3000`, e não por `127.0.0.1`: envios de outra origem são recusados.

Para parar o banco de desenvolvimento, use `npm run db:dev:down`. Os dados ficam no volume `decida-voto-dev-data`.

## Testes

```bash
npm test                  # unitários: cálculo, validação de idade, criptografia, dados (roda antes de todo build)
npm run test:integration  # integração com PostgreSQL real: gravação, restrições, estatísticas, limites, sessões
npm run build && npm run test:e2e   # ponta a ponta (desktop e celular): fluxo, navegação, proteções da API, painel, acessibilidade (axe)
npm run lint
npm run check:links       # links de fontes e notícias
```

Os testes de integração e de ponta a ponta exigem o banco de teste (`npm run db:test:up`). Para desligá-lo: `npm run db:test:down`.

Limitações conhecidas dos testes automáticos:

- O celular é emulado (Pixel 7 no Chromium). Safari/iOS e leitores de tela reais (TalkBack, VoiceOver) não são testados automaticamente; faça uma checagem manual antes do lançamento.
- O axe cobre as regras automáticas da WCAG 2.1 A/AA. Ordem de leitura, clareza dos textos e uso só pelo teclado precisam de revisão humana.

## Banco de dados

- Alterou `src/server/db/schema.ts`? Gere a migração com `npm run db:generate` e revise o SQL em `drizzle/`.
- As migrações são aplicadas automaticamente pelo serviço `migrate` do Docker Compose.

## Atualizar conteúdo

1. Edite `src/data/positions.json` ou `news.json`. Toda posição `documented` precisa de ao menos uma fonte `https`.
2. Incremente `version` e atualize `updatedAt`. A versão é gravada com cada participação, para permitir recálculo.
3. Rode `npm run check:links` e `npm run build`.
4. Após a revisão humana, mude `reviewStatus` para `"revisado"`. É um controle interno e não aparece no site.

## Regras de conteúdo e privacidade

- Nunca atribuir posição sem fonte verificável. Na dúvida, use `"status": "insufficient"`.
- Aplicar os mesmos critérios aos dois candidatos.
- **Não divulgar** estatísticas do painel: resultados que permitam inferir a ordem dos candidatos podem configurar enquete proibida no período eleitoral (Res. TSE 23.600/2019, art. 23).
- Não adicionar campos que identifiquem pessoas, como nome, e-mail, CPF, IP ou idade exata.
