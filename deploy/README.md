# Implantação e operação na VPS

```
Internet ──HTTPS──> Nginx (VPS) ──> 127.0.0.1:3000 ──> app (Docker) ──rede interna──> db (PostgreSQL, Docker)
                                                                                       └─ backup diário (Docker) → ./backups
```

- O banco **não tem porta exposta**: só os contêineres do Compose o acessam.
- A aplicação escuta apenas em `127.0.0.1`. Só o Nginx da própria VPS chega até ela.
- Toda configuração sensível fica no arquivo `.env`, que **nunca** é versionado.

## Pré-requisitos (uma vez)

1. Docker Engine com o plugin Compose, Nginx e Certbot instalados na VPS.
2. DNS do domínio apontando para o IP da VPS.
3. Firewall liberando só SSH, 80 e 443. Exemplo: `ufw allow OpenSSH && ufw allow 80,443/tcp && ufw enable`.

## 1. Configurar

```bash
git clone <repositório> decida-voto && cd decida-voto
cp .env.example .env
chmod 600 .env
```

Preencha o `.env`:

| Variável | Como gerar / o que colocar |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` (só letras e números) |
| `FORM_TOKEN_SECRET`, `RATE_LIMIT_SECRET` | `openssl rand -hex 32` (um valor diferente para cada) |
| `APP_ORIGIN` | Endereço público exato, ex.: `https://www.seudominio.com.br` |
| `ADMIN_USERNAME` | Nome de usuário do painel |
| `ADMIN_PASSWORD_HASH` | `docker compose run --rm -it migrate npm run -s admin:hash` (digite a senha; mínimo 12 caracteres) |
| `PARTICIPACOES_EXCLUIR_APOS` | Data de exclusão automática dos dados. Mantenha igual a `RETENCAO_PARTICIPACOES` em `src/lib/site.ts`. |

## 2. Subir

```bash
docker compose up -d --build     # constrói, aplica migrações e inicia app + banco + backup
docker compose ps                # app e db devem aparecer como "healthy"
```

As migrações rodam automaticamente (serviço `migrate`) antes da aplicação iniciar.

Depois do primeiro acesso ao painel (`/admin`), preencha o cartão **Responsável pelos dados** (nome e e-mail de contato). Esses dados aparecem em Privacidade e Metodologia e são obrigatórios pela LGPD. Eles ficam no banco, não no código, e podem ser alterados pelo painel a qualquer momento.

## 3. Nginx e HTTPS

```bash
sudo cp deploy/nginx-limites.conf /etc/nginx/conf.d/decida-voto-limites.conf
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/decida-voto   # troque SEU_DOMINIO
sudo certbot certonly --nginx -d SEU_DOMINIO -d www.SEU_DOMINIO
sudo ln -s /etc/nginx/sites-available/decida-voto /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Recomendado: no bloco `location /admin/` do Nginx, libere o painel só para os seus IPs (`allow`/`deny`).

## 3b. Alternativa: Cloudflare Tunnel (sem Nginx)

Use quando as portas 80/443 da VPS já pertencem a outra aplicação. O contêiner `cloudflared` abre uma conexão de saída até a Cloudflare, que entrega o site com HTTPS. Nenhuma porta é aberta na VPS e nenhum outro serviço é alterado.

1. O domínio usa os servidores de DNS da Cloudflare (plano gratuito).
2. No painel da Cloudflare: Zero Trust › Networks › Tunnels › criar túnel do tipo Docker. Em "Public hostname", aponte o domínio para o serviço `HTTP` `app:3000`.
3. No `.env` da VPS: `COMPOSE_PROFILES=cloudflare`, `TRUSTED_IP_HEADER=cf-connecting-ip` e `CLOUDFLARE_TUNNEL_TOKEN=` com o token do túnel (segredo: grave direto na VPS).
4. `docker compose up -d --build`. O serviço `cloudflared` sobe depois que a aplicação fica saudável.
5. Na Cloudflare, em SSL/TLS › Edge Certificates, ative "Always Use HTTPS".

O limite de requisições por IP do Nginx fica a cargo da aplicação (que já limita token, envio e login). Se quiser uma camada extra, crie uma regra de rate limiting na Cloudflare.

## Operação do dia a dia

| Ação | Comando |
|---|---|
| Ver status | `docker compose ps` |
| Ver logs | `docker compose logs -f app` (ou `db`, `backup`) |
| Parar tudo | `docker compose stop` |
| Iniciar de novo | `docker compose start` |
| Reiniciar só a aplicação | `docker compose restart app` |
| Publicar nova versão | `git pull && docker compose up -d --build` |
| Trocar a senha do painel | gere um novo hash, atualize o `.env` e rode `docker compose up -d app` |
| Derrubar os contêineres (mantém os dados) | `docker compose down` |

> **Atenção:** `docker compose down -v` apaga o volume do banco, ou seja, **todos os dados**. Só use se for essa a intenção.

## Backup

- **Automático:** todo dia o serviço `backup` grava `./backups/decida-voto-AAAA-MM-DD.dump` e apaga cópias com mais de `BACKUP_RETENTION_DAYS` dias.
- **Manual:**
  ```bash
  docker compose exec -T db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > backups/manual-$(date +%F-%H%M).dump
  ```
- **Cópia fora da VPS:** os backups contêm dados sensíveis. Para levá-los a outro local, criptografe antes, por exemplo: `gpg -c arquivo.dump`.

## Restauração

```bash
docker compose stop app
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < backups/decida-voto-AAAA-MM-DD.dump
docker compose start app
```

Para conferir um backup sem mexer no banco em uso, restaure numa base temporária:

```bash
docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" restore_teste'
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d restore_teste --no-owner' < backups/ARQUIVO.dump
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d restore_teste -c "select count(*) from participacoes"'
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" restore_teste'
```

## Voltar para uma versão anterior

```bash
git checkout <tag-ou-commit-anterior> && docker compose up -d --build
```

As migrações só avançam. Se uma versão nova alterou o banco e for preciso desfazer, restaure o backup anterior à atualização (veja "Restauração").

## Retenção de dados (LGPD)

| Dado | Prazo | Como é apagado |
|---|---|---|
| Participações (perfil, respostas, resultado) | até `PARTICIPACOES_EXCLUIR_APOS` | serviço `backup`, automaticamente |
| Backups | `BACKUP_RETENTION_DAYS` dias (padrão 14) | serviço `backup` |
| Hash diário de IP (limite de requisições) | 48 horas | serviço `backup` |
| Tokens usados e sessões vencidas | ao expirar | serviço `backup` |
| Logs do Nginx | defina no `logrotate` (sugestão: 14 dias) | `logrotate` |

O Nginx **não registra** o envio de participações (`/api/participacoes/`), para não associar IP e horário a uma resposta.

## Segredos

- Trocar `FORM_TOKEN_SECRET` invalida questionários em andamento.
- Trocar `RATE_LIMIT_SECRET` zera os contadores de abuso.
- Nenhum dos dois afeta os dados já gravados.
- Nunca envie o `.env` por e-mail ou chat, e nunca o inclua em commits.
