FROM node:20-slim AS builder
WORKDIR /app
ENV PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @flowpilot/api build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
