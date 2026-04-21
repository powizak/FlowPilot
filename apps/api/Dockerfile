FROM node:20-slim AS builder
WORKDIR /app
ENV PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @flowpilot/shared build
RUN pnpm --filter @flowpilot/api build
RUN pnpm exec prisma generate --schema=prisma/schema.prisma

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/src/i18n ./dist/i18n
COPY --from=builder /app/apps/api/src/email/templates ./dist/email/templates
EXPOSE 3001
CMD ["node", "dist/main.js"]
