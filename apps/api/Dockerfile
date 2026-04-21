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
RUN pnpm exec prisma generate --schema=prisma/schema.prisma
# Produce a standalone, flat node_modules for the API (includes devDeps
# so prisma CLI + tsx are available at runtime for migrate + seed).
RUN pnpm --filter @flowpilot/api deploy --legacy /out

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates wget \
 && rm -rf /var/lib/apt/lists/*
# Flat deployable package (dist, node_modules, package.json, prisma/seed.ts)
COPY --from=builder /out/ ./
# Overlay canonical Prisma schema + migrations from repo root
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations
# Runtime assets referenced by the compiled code via __dirname
COPY --from=builder /app/apps/api/src/i18n ./dist/i18n
COPY --from=builder /app/apps/api/src/email/templates ./dist/email/templates
EXPOSE 3001
CMD ["node", "dist/main.js"]
