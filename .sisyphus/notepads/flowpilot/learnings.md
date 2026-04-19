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

## [Task 0] Walking Skeleton
- Node version used: v22.22.2
- pnpm version: 10.33.0
- Key decisions: created a local `.env` for compose runtime parity; kept Prisma schema to generator + datasource only; Docker runtime verification deferred because container tooling is unavailable in this environment
- Issues encountered: `docker`, `docker compose`, and `psql` were unavailable; rootless Docker bootstrap was blocked by missing `uidmap` and no sudo access
- Docker service names: app, postgres, redis, minio, caddy

## TypeScript Build Notes
- tsconfig.base.json uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`
- This requires **explicit `.js` extensions** in relative imports even in `.ts` source files
- Example: `from './types/user.js'` not `from './types/user'`
- The `pnpm --filter=@flowpilot/shared build` command runs `tsc -p tsconfig.json`
- Build output goes to `packages/shared/dist/` with declaration files (`.d.ts`)

## Prisma Generate Issues in pnpm Workspaces
- **Problem**: `prisma generate` failed with `ERR_PNPM_ADDING_TO_ROOT` when run via Prisma CLI
- **Root Cause**: Prisma CLI runs `pnpm add prisma@X.X.X -D --silent` from workspace root, but pnpm refuses to add packages to workspace root without `-w` flag or `ignore-workspace-root-check` config
- **Fix**: `pnpm config set ignore-workspace-root-check true`
- **Additional Fix**: Added to root package.json:
  ```json
  "pnpm": {
    "onlyBuiltDependencies": ["prisma", "@prisma/client", "@prisma/engines", "esbuild"]
  }
  ```
  This allows pnpm to run build scripts for these packages (previously blocked by pnpm 10+ security feature)
- **Verification**: `prisma generate --schema=prisma/schema.prisma` (run from apps/api) generates client to `node_modules/.pnpm/@prisma+client@.../node_modules/@prisma/client`

## Prisma Schema Structure
- Schema file: `prisma/schema.prisma` (at project root, not inside apps/api)
- Seed file: `apps/api/prisma/seed.ts`
- Generated client location: `node_modules/.pnpm/@prisma+client@VERSION_*/node_modules/@prisma/client`
- Import in code: `import { PrismaClient } from '@prisma/client'`

## [Task 3] Auth Module
- `@flowpilot/api` can consume `@flowpilot/shared` types through the workspace package after `packages/shared/dist` exists; no local tsconfig path override was needed.
- With NestJS Throttler v6, route-level limits use object syntax like `@Throttle({ default: { limit: 5, ttl: 60_000 } })`.
- In this repo's NodeNext setup, keep explicit `.js` extensions on all relative NestJS imports, including guards, strategies, modules, and DTOs.
- Prisma and Redis singleton access fit cleanly as `@Global()` Nest modules with lifecycle hooks for connect/disconnect.
