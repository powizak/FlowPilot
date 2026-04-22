# AGENTS.md

Guidance for AI agents (and humans) contributing to FlowPilot. The goal is to keep interfaces, styles, and deployment assumptions consistent. If anything here conflicts with the code, the code wins — fix this file afterwards.

## Project at a Glance

- Self-hosted ERP/PM: projects, tasks, time tracking, Czech-compliant invoicing, AI chat.
- TypeScript monorepo, pnpm workspaces + Turborepo.
- Target runtime: Synology NAS (Ryzen R5 1600, DSM 7.2) via Container Manager. Also runs on any Docker host.
- Single-tenant. Fixed roles: `admin`, `member`, `viewer`. No multi-tenant, no custom roles.
- Invoicing is rendered with **PDFKit**, not Puppeteer.
- i18n: Czech + English. Default Czech.

## Repository Layout

```
apps/api        # NestJS backend (ESM, 25+ modules)
apps/web        # React 19 + Vite + Tailwind v4
packages/shared # Shared types (ApiResponse, PaginatedResponse, ApiError, ...)
prisma/         # schema.prisma + migrations + seed.ts
docker-compose.yaml  # Synology stack (Caddy exposes :3000)
Caddyfile       # Reverse proxy, only exposed entrypoint
DEPLOYMENT.md   # NAS-specific runbook
.sisyphus/plans # Planning artifacts (READ ONLY for agents)
.debug/         # Git-ignored, user drops logs/screenshots here between iterations
```

Hard rules:

- File size **≤ 300 LOC**. Split when you approach the limit.
- No `any`, no `as any`, no `@ts-ignore`, no `@ts-expect-error`.
- No empty `catch {}` blocks.
- No "magic" abstractions. Explicit over implicit.
- No speculative commentary or JSDoc. Only comments that justify themselves:
  1. already existed, 2. BDD-style behavioural, 3. necessary for understanding. Otherwise remove.
- Everything user-configurable MUST be configurable (env var, settings page, or admin UI) — never hard-coded.

## Backend Conventions (`apps/api`)

### Module layout

Each feature is a Nest module with this shape:

```
auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  auth.types.ts
  decorators/
  dto/
  guards/
  strategies/
```

### ESM imports

The API is ESM. **Relative imports MUST include the `.js` suffix**, even from `.ts` source:

```ts
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
```

### Response envelope

All successful responses are wrapped:

```ts
// packages/shared/src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
```

Controllers return `ApiResponse<T>` or `PaginatedResponse<T>`. Errors throw Nest exceptions; the global filter emits `{ error: { code, message } }`.

Auth endpoints return `ApiResponse<AuthSession>` where `AuthSession = { user, accessToken, refreshToken }`. Refresh endpoint accepts `{ refreshToken }` (never `token`).

### Global guard + `@Public()`

`app.module.ts` registers a global `APP_GUARD: JwtAuthGuard`. **Every route is protected by default.** To expose an endpoint (health checks, login, register, public webhooks), add the decorator:

```ts
import { Public } from './auth/decorators/public.decorator.js';

@Public()
@Get('health')
health() { /* ... */ }
```

`/api/health` MUST stay `@Public()` — the Docker healthcheck depends on it.

### DTO validation (CRITICAL)

`main.ts` enables:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

With `whitelist: true`, any DTO field **without a `class-validator` decorator is silently stripped**. Downstream code then crashes on `undefined`.

Every DTO field MUST carry at least one validator:

```ts
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
```

When adding a field, add the decorator in the same commit.

### Auth flow

- JWT access token (short-lived) + refresh token (longer-lived).
- Refresh tokens are **hashed** and stored in Redis, keyed by `user.id + jti`.
- `AuthService.login`, `register`, and `refresh` all return `AuthSession` wrapped in `ApiResponse`.
- Passwords hashed with argon2 (see `auth.service.ts`).

### Prisma

- Schema at `prisma/schema.prisma`. Migrations in `prisma/migrations/`.
- `migrate deploy` runs on container boot.
- Seed is **not** part of boot. Run once manually:
  ```bash
  docker exec flowpilot-app node_modules/.bin/prisma db seed --schema=prisma/schema.prisma
  ```
- `package.json#prisma.seed` uses `node_modules/.bin/tsx prisma/seed.ts` (by path, no PATH lookup).
- When adding a foreign key, the FK column type MUST match the referenced PK type (e.g. both `String @id` / `@db.Uuid`).

### Environment variables

Canonical names only:

- `REDIS_URL` (not `REDIS_HOST`/`REDIS_PORT`) — parse with `new URL()` when BullMQ needs host/port.
- `MINIO_ENDPOINT` — full URL (`http://minio:9000`).
- `DATABASE_URL` — Postgres connection string.
- See [README.md](./README.md#environment-variables) for the full list.

## Frontend Conventions (`apps/web`)

### API client

`src/lib/api.ts` wraps axios. All responses follow the envelope, so callers unwrap twice:

```ts
const response = await api.post<ApiResponse<AuthSession>>(
  '/auth/login',
  payload,
);
const session = response.data.data; // { user, accessToken, refreshToken }
```

Forgetting `.data.data` is the #1 silent-failure pattern.

### State management

- Zustand stores in `src/stores/` (e.g. `stores/auth.ts`).
- Server state via TanStack Query where applicable.
- No Redux, no context-as-store.

### Routing + auth

- Protected routes redirect to `/login` when the auth store has no `accessToken`.
- After a successful login, the store sets tokens and the app navigates to the originally requested route (or `/`).

### Styling

- Tailwind CSS v4 (CSS-first config).
- Dark theme is the default; design for keyboard-first and mobile-responsive.
- Bottom navigation on mobile breakpoints.

### i18n

- `react-i18next`. Keys in `src/locales/{cs,en}/`. Default `cs`.
- Never ship hardcoded user-facing strings — add translation keys.

## Docker & Deployment

- Runtime image built via `pnpm deploy --legacy /out` (flat `node_modules`, includes devDeps so `tsx` and `prisma` CLI exist at runtime).
- Dockerfile copies `prisma/seed.ts` into the deployed output.
- Healthchecks:
  - `app`: `node -e "require('http').get('http://localhost:3001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"`, `start_period: 40s`.
  - `web`: `wget --spider` against the Vite preview, `start_period: 15s`.
- Caddy `depends_on` both `app` and `web` with `condition: service_healthy`. Neither may stay unhealthy or the stack won't come up.
- Only port exposed to the host is Caddy on `${APP_EXTERNAL_PORT:-3000}`.
- Synology-specific guidance lives in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Testing

- Unit / integration: Vitest (`pnpm test`).
- E2E: Playwright, specs in `apps/web/e2e/`.
- Never delete a failing test to make CI green. Fix the root cause or mark it `.skip` with an issue reference.

## Git & Commit Conventions

- Conventional commits with scope: `fix(auth): ...`, `feat(invoices): ...`, `chore(docker): ...`, `docs: ...`.
- Subject line imperative, ≤ 72 chars. Body explains the **why**, not the diff.
- Commit only when the user explicitly asks. After committing a user-requested fix, push to `origin/main` unless told otherwise.
- Never force-push `main`. Never amend a pushed commit.
- When running git in a non-interactive shell, export the pager/editor-disabling env block (see session setup).

## Bugfix Scope

When fixing a bug, also resolve trivial issues found in touched files: lint errors, missing button `type` props, obvious small bugs, dead code next to the fix, leftover `any` you can replace without effort. Do not stop at the minimum reproduction fix.

For larger findings (architectural issues, wide-reaching refactors, bugs outside the touched area), flag them in the report and ask before expanding scope. The default is: **fix what's in front of you, flag what's beyond it.**

## Failure Recovery

1. Stop editing. Revert to the last known-good state.
2. Consult the Oracle or the user with full context (files touched, error, hypothesis).
3. Do not shotgun-debug. One hypothesis, one change, one verification.

## Specialist Delegation (for orchestrator agents)

- **explore** — internal codebase grep, always background + parallel.
- **librarian** — external docs / OSS references.
- **oracle** — architecture review, hard debugging, post-implementation review.
- **metis** — pre-planning analysis on ambiguous requests.
- **momus** — review work plans saved to `.sisyphus/plans/*.md`.

Do not re-do a search you just delegated. Wait for the completion notification, then collect results.

## Quick Checklist Before Declaring Done

- [ ] `pnpm lint` clean on changed packages.
- [ ] LSP diagnostics clean on edited files.
- [ ] `pnpm build` passes if build artifacts are affected.
- [ ] No new `any` / `@ts-ignore` / empty catch introduced.
- [ ] New DTO fields have `class-validator` decorators.
- [ ] New public routes carry `@Public()`; new private routes rely on the global guard.
- [ ] Frontend calls unwrap `response.data.data`.
- [ ] Touched files still ≤ 300 LOC.
- [ ] Commit + push only if the user asked.
