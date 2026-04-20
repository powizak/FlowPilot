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

## [Task 4] Settings Module
- Auth DTOs (login.dto.ts etc.) use plain classes without decorators - no class-validator/class-transformer imports
- RedisService key methods: `get(key)`, `set(key, value, ttl?)`, `del(key)`
- Setting Prisma model uses `SettingValueType` enum (STRING, NUMBER, BOOLEAN, JSON), not `SettingType`
- Settings module not @Global() - imported directly in AppModule imports array
- Cache key prefix: `settings:` (e.g., `settings:myKey`)
- Type coercion in service: NUMBER → Number(), BOOLEAN → true/false strings, JSON → JSON.parse(), STRING → as-is
- @Roles decorator takes string value cast to UserRole (e.g., @Roles('ADMIN' as UserRole))
- On module init, warmCache() loads all settings into Redis for performance

## [Task 7] Work Types Module
- WorkType model in schema has NO createdAt/updatedAt fields, but @flowpilot/shared WorkType interface expects them
- Solution: Transform Prisma result using `toWorkType()` helper that adds createdAt/updatedAt as new Date() and converts Decimal hourlyRate to Number
- ValidationPipe must be added to main.ts: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`
- class-validator and class-transformer needed for DTO validation
- Color validation via regex: `^#[0-9A-Fa-f]{6}$` (checked in service layer, not DTO)
- Name uniqueness checked in service layer (schema has no @unique on name field)
- Soft delete sets `isActive = false` (no deletedAt field in schema)
- @Roles('ADMIN' as UserRole) marks admin-only routes
- GET /api/work-types returns active only by default; `?includeInactive=true` returns all

### Task 9: React App Shell
- Configured Tailwind CSS v4 in Vite using the `@tailwindcss/vite` plugin without PostCSS.
- Setup `zustand` to persist theme and auth states, storing standard dark/light themes.
- Used native CSS variables with `@theme` block inside `index.css` for simple styling matching the Linear dark/light palettes.
- Set up a centralized Radix UI `Dialog` for the `Cmd+K` palette trigger hooked onto a global Zustand UI store.
- Re-exported correctly components when using `react-i18next` inside shared layouts like `Sidebar` (e.g., using explicit functional imports instead of `default` where required).

## [Task 8] Projects Module
- Prisma project filtering on JSON tags works with `tags: { array_contains: ['tag1', 'tag2'] }` for exact string array matches in Postgres JSONB.
- The existing Prisma schema uses `ProjectMemberRole` and includes `ON_HOLD`/`HOURLY` enum values, so API DTO/shared-value mapping must translate between lowercase API strings and Prisma enums.
- To clone Prisma JSON fields (`tags`, task `labels`, `customFields`) into create inputs, convert nullable `JsonValue` to `Prisma.InputJsonValue | typeof Prisma.JsonNull` to satisfy Prisma TypeScript types.
- Keeping under the 300 LOC/file limit worked best by splitting projects logic into access, stats, clone, mapper, and orchestration services.
- Normalize stored/query tags to lowercase if filtering via JSON `array_contains`; otherwise tag filters become unintentionally case-sensitive.
- Protect project ownership invariants in member-management flows so the last OWNER cannot remove or demote themselves.
- Clone is effectively project creation, so it should reuse the same create-role gate as POST `/api/projects`.

## [Task 10] Tasks Module
- The current Prisma task schema only has `TaskStatus` = TODO/IN_PROGRESS/DONE/CANCELLED and dependency enums BLOCKS/BLOCKED_BY/RELATES_TO, so richer API workflow states and dependency types can be preserved in `customFields.workflowStatus` plus service-layer enum mapping.
- The task schema has no `deletedAt` or `actualHours` columns; soft delete can be represented in `customFields.deletedAt`, and actual hours can be derived from `TimeEntry.durationMinutes` when shaping API responses.
- Recursive task fetches stay manageable by building small reusable Prisma `include` helpers and letting the mapper compute aggregated child time summaries from nested `childTasks`.

## [Task 13] Time Tracking Module
- The Prisma `TimeEntry` model in this repo originally lacked `invoiceId` and `billingAmount`, so supporting invoiced-entry locking and billing aggregation required extending both the Prisma schema and shared `TimeEntry` type.
- For timer stops that cross midnight, splitting into UTC day segments by closing one entry at `23:59:59.999` and starting the next at `00:00:00.000` avoids date-report drift and preserves exact elapsed milliseconds across segments.
- A small `SettingsService.get(key)` helper is useful when business logic needs raw string settings like `timeTracking.roundingMinutes` without the typed wrapper returned by `findOne()`.
- Keeping the main time-entries orchestrator under the 300 LOC limit worked best by extracting rate/rounding/billing resolution into a dedicated `TimeEntriesBillingService` plus shared date/duration helpers.
## [Task 14] Time Tracking UI
- Implemented TimerWidget in Topbar.
- Created TimePage with Timesheet and Calendar tabs.
- Used `api.get` and `api.post` from `apps/web/src/lib/api.ts` for backend interactions.
- Followed Linear dark UI styles.
## [Task 15] Project Dashboard — Budget vs Actual, Progress\n- Added `recharts` to .\n- Used `ProjectStats` which is already included in `ProjectView` from the backend endpoint `/api/projects/:id` to easily render tasks completed, budget vs actuals.\n- Leveraged `/api/time-entries/report` to compute grouped work type metrics.\n- Added `Dashboard` as a `ViewType` in `ProjectDetail.tsx`.\n- Kept UI consistent with Linear dark theme conventions.
## [Task 15] Project Dashboard — Budget vs Actual, Progress
- Added recharts to web package.
- Used ProjectStats which is already included in ProjectView from the backend endpoint /api/projects/:id to easily render tasks completed, budget vs actuals.
- Leveraged /api/time-entries/report to compute grouped work type metrics.
- Added Dashboard as a ViewType in ProjectDetail.tsx.
