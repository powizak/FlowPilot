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

## [Task 16] Reports API

- Used `@Res() res: any` to avoid express type dependency for CSV responses; `res.json()` for JSON, `res.send()` for CSV
- CSV export: UTF-8 BOM (\\uFEFF) prepended for Czech Excel compatibility
- All 4 endpoints: timesheet (grouped by day/week/month), project/:id (financial stats), billing (unbilled entries), utilization (per-user billable %)
- Kept controller thin — all aggregation logic in ReportsService
- No access control decorator needed — authenticated users can view reports

## [Task 17] Reports UI — Timesheet View, Charts, CSV Export

- Added Reports Page with tabs: Timesheet, Project, Utilization, Unbilled
- Implemented charts using Recharts: BarChart and PieChart for visual breakdown
- Date range presets dynamically compute ranges for the charts
- Added CSV export using Blob fetching from the API to handle auth correctly without query params

## [Task 18] Added Settings page with section components (General, WorkTypes, TimeTracking, Invoice, UserProfile) with RBAC

## Task 21: Clients CRM Module (2026-04-20)

- Prisma Json fields need `Prisma.InputJsonValue` type, not `Record<string, unknown>` — the latter doesn't satisfy Prisma's union type
- Pre-existing build errors in bank-accounts and projects modules — don't try to fix those
- Auth guards are global (JwtAuthGuard + RolesGuard), just use `@Roles()` decorator
- ARES API: `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}` returns JSON with `obchodniJmeno`, `sidlo`, `dic`
- IČO checksum: weights [8,7,6,5,4,3,2] on digits 1-7, remainder=11-(sum%11), special cases: 10→1, 11→0
- `pnpm --filter api build` can timeout; `npx tsc --noEmit` is faster for type-checking

## Task 23: Product/Service Catalog Module (2026-04-20)

- Product model fields: id, name, description, unit, defaultUnitPrice (Decimal), defaultVatPercent (Decimal), category, isActive
- Paginated list: `skip: (page-1)*limit, take: limit`, returns `{ data, meta: { total, page, limit } }`
- Categories endpoint: `prisma.product.findMany({ distinct: ['category'], select: { category: true }, where: { category: { not: null } } })`
- Deactivate: `update({ where: { id }, data: { isActive: false } })`
- Decimal fields need `Number()` conversion for API responses
- `@Roles('ADMIN' as UserRole)` for write operations; reads accessible to all authenticated users

## Task 22: Bank Accounts Module (2026-04-20)

- BankAccount model: id, name, bankName, accountNumber, iban, swift, currency, isDefault, isActive
- IBAN validation: regex `^[A-Z]{2}[A-Z0-9]{13,32}$` (2 letters + 13-32 alphanumeric)
- Only one default per currency: `clearDefaultForCurrency()` sets all others to false before setting new default
- Response shape: `{ data: account }` for single, `{ data: [...] }` for list
- Soft delete sets `isActive = false`
- Controller routes: GET (all), GET :id, POST (admin), PUT :id (admin), PUT :id/default (admin), DELETE :id (admin)
- Service layer IBAN validation with BadRequestException
- DTOs use `!` for definite assignment (strict TypeScript mode)
- BankAccount type added to packages/shared/src/types/ and exported from index.ts

## Task 27: SPAYD QR Code Generation (2026-04-20)

- SPAYD string format: `SPD*1.0*ACC:{IBAN}*AM:{AMOUNT}*CC:{CURRENCY}*VS:{VARIABLE_SYMBOL}*DT:{DUE_DATE_YYYYMMDD}*MSG:{MESSAGE}`
- ACC: uses bankAccount.iban if set, otherwise bankAccount.accountNumber
- AM: invoice total with 2 decimal places
- VS: extracts all digits from invoiceNumber (e.g., "2026-001" → "001")
- DT: dueDate formatted as YYYYMMDD
- MSG: "Faktura {invoiceNumber}" truncated to 60 chars
- QR code: `qrcode.toBuffer(spaydString, { errorCorrectionLevel: 'M', width: 300, type: 'png' })`
- **InvoicesModule does NOT exist** — QR endpoint `GET /api/invoices/:id/qr` needs to be wired when InvoicesModule is created
- SpaydService created as standalone service in `apps/api/src/invoices/spayd/spayd.service.ts`
- When InvoicesModule exists, add QR endpoint that: fetches invoice+bankAccount, calls SpaydService to generate SPAYD, returns PNG with Cache-Control: public, max-age=3600
- Invoice has `qrCodeData` field that can store computed SPAYD string on create/update
- For React state management with backend logic, inline `useStates` and wrapping API calls in try-catch-finally block provides clean component-level fetching without external libraries.
- Creating a full CRUD pattern includes a list/table, search bar, generic add/edit modal, and specialized tabs in the detail view.

## Task 25: Invoice Module (2026-04-20)

- Keep invoice files under the 300 LOC cap by splitting orchestration into `InvoicesService`, `InvoiceLineItemsService`, `InvoiceNumberingService`, and shared invoice helpers.
- Invoice numbering can stay thread-safe with Prisma by `upsert`-ing the `(prefix, year)` row inside `$transaction`, then incrementing `lastNumber` with `update`.
- For this codebase, Prisma invoice totals and line item decimals are easiest to manage by computing in service helpers with `Number(...)` plus explicit 2-decimal rounding before persisting.
- Draft-only mutability is best enforced in a shared `assertDraft()` helper reused by invoice update/delete and line-item mutations.
- The current shared `UserRole` type is lowercase (`'admin' | 'member' | 'viewer'`), so invoice controller role decorators must use lowercase values even though Prisma enums are uppercase.

## Task 26: Invoice from Time Entries (2026-04-20)

- NestJS route order matters here: static invoice routes like `preview-from-entries` and `from-entries` must stay above `:id` routes in `InvoicesController`, otherwise the param route captures them.
- For query/body support of `workTypeIds[]`, a DTO-level `@Transform()` can normalize repeated params, bracket-style params, and comma-separated strings into one validated UUID array.
- The safest invoice generation flow is: preview/build grouped line items first, then inside one Prisma `$transaction` create the invoice, create grouped line items, and `updateMany` only `invoiceId: null` entries so concurrent invoicing turns into a conflict instead of double-billing.
- Grouping time entries by work type is easiest with an in-memory `Map`, while keeping invoice quantities precise by converting summed minutes to hours with 3 decimal places and totals with 2-decimal currency rounding.

## Task 28: Invoice PDF Generation (2026-04-20)

- DejaVu Sans from `/usr/share/fonts/truetype/dejavu/` works with PDFKit for Czech diacritics, so explicit font registration avoids UTF-8 rendering issues in generated invoice PDFs.
- In this repo there is no shared `MinioService` yet; invoice PDF endpoints can safely fall back to on-demand PDF regeneration while still keeping the service boundary ready for future object storage wiring.
- Keeping the PDF layout service self-contained under 300 LOC worked by extracting small render helpers for header, supplier/client blocks, dates, table, totals, payment info, and footer/QR sections.

## Task 30: Email Sending Module (2026-04-20)

- BullMQ in NestJS: `BullModule.forRoot({ connection: { host, port } })` + `BullModule.registerQueue({ name: 'email' })` in EmailModule, `@InjectQueue('email')` in service, `@Processor('email') extends WorkerHost` for processor
- Redis connection for BullMQ is separate from the ioredis RedisService — BullMQ needs its own connection config via `BullModule.forRoot()`
- Nodemailer transporter created on-demand from settings (email.smtpHost/Port/User/Pass) — returns null if not configured, processor logs warning and skips
- Handlebars templates compiled and cached in-memory; template files read from `__dirname/templates/*.hbs` (copied to dist on build)
- PDF attachment: base64-encode Buffer for BullMQ job serialization, decode back in processor before attaching
- Email queueing is fire-and-forget from InvoicesService.send() — `.catch(() => {})` so email failures don't break the send endpoint
- InvoicePdfService added to InvoicesModule providers so InvoicesService can generate PDF for attachment

## Task 36: Advanced Filters + Saved Views (2026-04-20)

- This repo currently has no API global prefix in `main.ts`, so routes that need `/api/...` externally should keep that prefix in the controller path.
- For task advanced filters in ListView, loading a large task page once and filtering client-side lets saved views work without touching Kanban, Gantt, or Calendar implementations.
- Migration SQL files in this repo can omit Prisma-generated heading comments and still match the existing migration style well enough for manual create-only recovery.

## Task 47: MCP Server + API Keys (2026-04-20)

- Reusing the existing ApiKey auth guard pattern works cleanly for MCP by marking the controller `@Public()` and applying `@UseGuards(ApiKeyAuthGuard)` at class level so the global JWT guard is bypassed while request.user is still populated.
- Keeping the MCP JSON-RPC implementation under the 300 LOC limit worked best by splitting static resource/tool/prompt catalogs and billing/shared helpers out of `mcp.controller.ts` and `mcp.service.ts`.
- For a lightweight MCP-compatible endpoint, returning `{ jsonrpc, id, result }` from a single POST handler is enough for initialize/resources/tools/prompts workflows without wiring the full SDK transport layer.
  \n## AI Action Buttons Implementation\n- Added reusable and components to handle async AI skill execution with a unified UX.\n- leverages for accessible, stable overlay display.\n- Implemented pattern to allow context-specific rendering of AI suggestions before confirmation (e.g., list of tasks vs generated invoice note).

## AI Action Buttons Implementation

- Added reusable `AIActionButton` and `AIPreviewModal` components to handle async AI skill execution with a unified UX.
- `AIPreviewModal` leverages `@radix-ui/react-dialog` for accessible, stable overlay display.
- Implemented `previewRenderer` pattern to allow context-specific rendering of AI suggestions before confirmation.

## File Attachments (Task 51)

- MinIO service in docker-compose: `MINIO_ROOT_USER=flowpilot`, `MINIO_ROOT_PASSWORD=flowpilot123`, endpoint `minio:9000`
- `minio` npm SDK for Node.js — `Client`, `putObject`, `presignedGetObject`, `removeObject`
- MinioService gracefully handles connection failures (logs warning, doesn't crash)
- File upload via `@nestjs/platform-express` Multer: `FileInterceptor('file')` + `@UploadedFile()`
- Storage path pattern: `{taskId}/{uuid}-{originalFilename}`
- DB not accessible in dev — create migration SQL manually, matching Prisma's format
- `@CurrentUser()` decorator at `apps/api/src/auth/decorators/current-user.decorator.ts` for extracting user from request
- Made FlowPilot responsive using Tailwind v4 (sm:, md:, lg: prefixes) across Layout, Topbar, Sidebar, Kanban, List views, and Modal forms.

## Task 52: Activity Log / Audit Trail (2026-04-20)

- ActivityLog model: cuid id, entityType+entityId (indexed), userId (FK to User), action string, metadata Json?, createdAt
- ActivityService.log() is fire-and-forget (no await, .catch(() => {})) to avoid blocking task operations
- ActivityModule exported from its own module, imported into TasksModule, CommentsModule, ProjectsModule — NOT global
- Activity endpoints: GET /api/tasks/:taskId/activity, GET /api/projects/:projectId/activity with cursor-based pagination
- Logging integrated at operation level in TasksService (create, update, move) and CommentsService (create, delete)
- Frontend ActivityFeed.tsx: vertical timeline with colored dots per action type, avatar, relative timestamps
