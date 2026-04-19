# FlowPilot Learnings

## Stack
- TypeScript monorepo: pnpm workspaces + Turborepo
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: React + Vite
- Shared: packages/shared (types/utils)
- Docker: app, postgres, redis, minio, caddy

## Conventions
- Linear-inspired UI (minimalist, dark, keyboard-first)
- i18n from start (CZ + EN)
- Single-tenant (no multi-tenant abstractions)
- Fixed roles: admin/member/viewer
- PDF: PDFKit (not Puppeteer)
- Max 300 LOC per task
- Git remote: https://github.com/powizak/FlowPilot.git (account: powizak)
