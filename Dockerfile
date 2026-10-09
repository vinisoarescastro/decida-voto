# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Imagem de manutenção: aplica migrações e roda utilidades (ex.: gerar hash da senha do painel).
FROM deps AS migrator
COPY . .
CMD ["node", "scripts/migrate.mjs"]

FROM deps AS build
COPY . .
# O build roda antes os testes unitários e a validação dos dados (prebuild).
RUN npm run build

# Imagem final: só o servidor standalone, sem código-fonte nem dependências de desenvolvimento.
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
