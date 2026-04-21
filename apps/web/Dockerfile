FROM node:20-slim AS builder
WORKDIR /app
ENV PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable
COPY . .
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @flowpilot/shared build
RUN pnpm --filter @flowpilot/web build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
