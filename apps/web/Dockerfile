FROM node:20-slim AS builder
WORKDIR /app
ENV PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @flowpilot/web build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
