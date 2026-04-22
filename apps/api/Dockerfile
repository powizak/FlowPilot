# syntax=docker/dockerfile:1.6
FROM node:20-slim AS builder
WORKDIR /app
ENV PATH=/root/.local/share/pnpm:$PATH
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @flowpilot/shared build
RUN pnpm --filter @flowpilot/api build
# Produce a standalone, flat node_modules for the API (includes devDeps
# so prisma CLI + tsx are available at runtime for migrate + seed).
RUN pnpm --filter @flowpilot/api deploy --legacy /out
# Place canonical schema + migrations into the deployed tree, then run
# `prisma generate` INSIDE /out so .prisma/client lands in the flat
# node_modules layout (pnpm deploy skips dot-prefixed dirs).
RUN mkdir -p /out/prisma \
 && cp /app/prisma/schema.prisma /out/prisma/schema.prisma \
 && cp -r /app/prisma/migrations /out/prisma/migrations \
 && cp /app/apps/api/prisma/seed.ts /out/prisma/seed.ts \
 && cd /out && ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates wget \
 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /out/ ./
# __dirname-referenced runtime assets not captured by pnpm deploy
COPY --from=builder /app/apps/api/src/i18n ./dist/i18n
COPY --from=builder /app/apps/api/src/email/templates ./dist/email/templates
EXPOSE 3001
CMD ["node", "dist/main.js"]
