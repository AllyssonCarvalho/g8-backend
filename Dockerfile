
# -------------------------------
# 1 — Builder
# -------------------------------
FROM node:20 AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build


# -------------------------------
# 2 — Runner
# -------------------------------
FROM node:20-slim AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY start.sh ./start.sh

# Dá permissão de execução ao start.sh
RUN chmod +x start.sh

EXPOSE 3333

CMD ["sh", "start.sh"]
