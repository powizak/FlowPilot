# FlowPilot — Complete Work Plan

## TL;DR

> **Quick Summary**: Build FlowPilot, a self-hosted ERP/PM system combining project management, time tracking, Czech-compliant invoicing, and AI integration. TypeScript monorepo (NestJS + React + Prisma + PostgreSQL) targeting Synology Docker deployment. Linear-inspired UI, keyboard-first, dark mode.
> 
> **Deliverables**:
> - Fully functional PM system with Kanban/List/Calendar/Gantt views
> - Time tracking with configurable work types and rates
> - Czech-compliant invoice generator with SPAYD QR codes and PDF export
> - AI integration (multi-provider) with task decomposition, meeting notes→tasks
> - MCP server for AI agent access
> - REST API with full CRUD for all entities
> - Multi-user support with role-based access (admin/member/viewer)
> - Docker Compose deployment for Synology NAS
> 
> **Estimated Effort**: XL (5 phases, ~50+ tasks)
> **Parallel Execution**: YES - multiple waves per phase
> **Critical Path**: Walking Skeleton → Auth → Projects → Tasks → Time Tracking → Clients → Invoicing → Views → AI → Polish

---

## Context

### Original Request
Build FlowPilot — a self-hosted ERP/PM system based on detailed architectural specification in `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md`. Solo developer + AI, all 5 phases in one plan.

### Interview Summary
**Key Discussions**:
- **Stack**: TypeScript — NestJS + React (Vite SPA) + Prisma + PostgreSQL
- **Multi-user**: From start, 3 fixed roles (admin/member/viewer)
- **UI**: Linear-inspired (minimalist, dark, keyboard-first)
- **Monorepo**: pnpm workspaces + Turborepo
- **Configurability**: Everything configurable via UI from day one
- **Testing**: Tests after implementation + agent QA scenarios
- **Tenant**: Single-tenant (SaaS = future rewrite)
- **DPH**: Not a VAT payer, but support VAT in code (configurable)
- **Integrations MVP**: Email (SMTP via WEDOS) + iCal export
- **Invoice numbering**: Fully configurable format
- **PDF**: Lightweight (PDFKit, not Puppeteer) due to Synology constraints

### Metis Review
**Identified Gaps** (addressed):
- Walking skeleton as Task 0 — incorporated
- Single-tenant confirmed — no multi-tenant abstractions
- Phase 1 configurability scoped to settings table + basic UI page
- Fixed roles (admin/member/viewer) — no custom roles
- PDF generation: PDFKit instead of Puppeteer for Synology
- Prisma limitations for recursive task trees — plan raw SQL escape hatches
- Docker volume persistence strategy — explicit in deployment tasks
- i18n from start (CZ + EN)

---

## Work Objectives

### Core Objective
Build a complete, self-hosted ERP/PM system that replaces Freelo + invoicing tools + Google Docs + AI assistant with one cohesive system running on Synology Docker.

### Concrete Deliverables
- Monorepo with `apps/api` (NestJS), `apps/web` (React), `packages/shared` (types/utils)
- PostgreSQL database with full schema (Prisma)
- REST API with JWT auth, full CRUD for all entities
- React SPA with Linear-style UI: Kanban, List, Calendar, Gantt, Dashboard views
- Invoice PDF generator with Czech compliance + SPAYD QR
- AI engine with multi-provider support and pre-built skills
- MCP server exposing FlowPilot data to AI agents
- Docker Compose for Synology deployment (app, worker, postgres, redis, minio, caddy)

### Definition of Done
- [ ] `docker compose up` on Synology → app accessible, all features functional
- [ ] All API endpoints return correct responses (tested via curl)
- [ ] All UI views render and interact correctly (tested via Playwright)
- [ ] Invoice PDF contains all Czech legal requirements
- [ ] AI skills produce structured output from LLM calls
- [ ] MCP server responds to tool/resource requests

### Must Have
- Multi-user auth with JWT (access + refresh tokens)
- Role-based access control (admin/member/viewer) per project
- All CRUD operations via REST API
- Kanban drag-drop with persistence
- Timer start/stop with correct duration calculation
- Czech-compliant invoices with SPAYD QR codes
- PDF generation (server-side, lightweight)
- Settings UI for all configurable items
- i18n (Czech + English)
- Docker Compose deployment

### Must NOT Have (Guardrails)
- NO multi-tenant abstractions (no tenant_id, no tenant isolation)
- NO custom roles beyond admin/member/viewer
- NO visual workflow builder (workflows configured via simple settings)
- NO custom field system / dynamic form builder
- NO AI abstractions before Phase 4 (no premature AIProvider interfaces)
- NO Puppeteer/Chromium for PDF (use PDFKit or similar lightweight lib)
- NO native mobile app
- NO payment gateway integration
- NO e-invoicing formats (ISDOC)
- NO over-commented code, no excessive JSDoc, no AI slop patterns
- NO "magic" abstractions — explicit over implicit
- Max 300 LOC implementation per task

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: YES (tests after implementation)
- **Framework**: Vitest (unit/integration) + Playwright (E2E)
- **Setup**: Part of Walking Skeleton (Task 0)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright — navigate, interact, assert DOM, screenshot
- **API/Backend**: Bash (curl) — send requests, assert status + response fields
- **Infrastructure**: Bash — docker compose up, verify health endpoints
- **Library/Module**: Bash (node REPL or vitest) — import, call, assert

---

## Execution Strategy

### Parallel Execution Waves

```
=== PHASE 0: FOUNDATION ===
Wave 0.1 (Walking Skeleton):
├── Task 0: Monorepo + Docker + Empty apps wired together [deep]

=== PHASE 1: MVP ===
Wave 1.1 (Core schemas + Auth — foundation for everything):
├── Task 1: Shared types package (all entity types/enums) [quick]
├── Task 2: Prisma schema (all Phase 1 entities) [quick]
├── Task 3: Auth module (register, login, JWT, refresh, guards) [deep]
├── Task 4: Settings module (key-value settings table + API) [quick]
├── Task 5: i18n setup (CZ + EN, react-i18next + backend) [quick]

Wave 1.2 (Core modules — parallel after schema):
├── Task 6: Users module (CRUD, profile, avatar) [unspecified-high]
├── Task 7: Work Types module (CRUD, rates, colors) [quick]
├── Task 8: Projects module (CRUD, templates, clone, archive) [deep]
├── Task 9: React app shell (layout, routing, theme, sidebar, keyboard nav) [visual-engineering]

Wave 1.3 (Tasks + Time — depends on Projects):
├── Task 10: Tasks module — CRUD + subtasks + dependencies [deep]
├── Task 11: Tasks Kanban view (drag-drop, status columns) [visual-engineering]
├── Task 12: Tasks List view (table, inline edit, bulk actions, sort/filter/group) [visual-engineering]
├── Task 13: Time Tracking module — CRUD + timer start/stop [deep]

Wave 1.4 (Integration + Reports):
├── Task 14: Time Tracking UI (timer widget, manual entry, bulk entry) [visual-engineering]
├── Task 15: Project dashboard (budget vs actual, progress) [visual-engineering]
├── Task 16: Basic reports API (timesheet, project stats, utilization) [unspecified-high]
├── Task 17: Reports UI (timesheet view, charts) [visual-engineering]
├── Task 18: Settings UI page (work types, project defaults, user prefs) [visual-engineering]

Wave 1.5 (Phase 1 completion):
├── Task 19: Phase 1 Docker deployment + smoke test on Synology [unspecified-high]

=== PHASE 2: BILLING ===
Wave 2.1 (Schema + Clients):
├── Task 20: Prisma schema extension (Client, Contact, Invoice, InvoiceLineItem, BankAccount, Product) [quick]
├── Task 21: Clients CRM module (CRUD, contacts, search) [unspecified-high]
├── Task 22: Bank Accounts module (CRUD, default account) [quick]
├── Task 23: Product/Service catalog module (CRUD, categories) [quick]

Wave 2.2 (Invoice core):
├── Task 24: Clients UI (list, detail, contacts) [visual-engineering]
├── Task 25: Invoice module — CRUD + line items + configurable numbering [deep]
├── Task 26: Invoice from time entries (select entries → generate lines) [deep]
├── Task 27: SPAYD QR code generation [quick]

Wave 2.3 (Invoice output + delivery):
├── Task 28: Invoice PDF generation (PDFKit, Czech compliant layout) [deep]
├── Task 29: Invoice UI (list, create/edit, preview, status management) [visual-engineering]
├── Task 30: Email sending module (SMTP, invoice delivery, notifications) [unspecified-high]
├── Task 31: iCal export (task deadlines as calendar events) [quick]

Wave 2.4 (Phase 2 completion):
├── Task 32: Phase 2 Docker deployment + invoice smoke test [unspecified-high]

=== PHASE 3: VIEWS ===
Wave 3.1 (Calendar + Gantt):
├── Task 33: Calendar view (deadline calendar, time entry blocks) [visual-engineering]
├── Task 34: Gantt chart (dependencies as arrows, milestones, zoom) [visual-engineering]
├── Task 35: Dashboard page (fixed widgets: today's tasks, running timer, overdue, budget) [visual-engineering]

Wave 3.2 (Advanced features):
├── Task 36: Advanced filters + saved views (per-user view presets) [deep]
├── Task 37: Global search (full-text across projects, tasks, clients, invoices) [deep]
├── Task 38: Notification system (in-app + email digest) [unspecified-high]

Wave 3.3 (Phase 3 completion):
├── Task 39: Phase 3 Docker deployment + views smoke test [unspecified-high]

=== PHASE 4: AI ===
Wave 4.1 (AI Engine):
├── Task 40: AI Engine module (multi-provider: OpenAI, Gemini, OpenRouter) [deep]
├── Task 41: AI config UI (provider settings, API keys, model selection, budget) [visual-engineering]

Wave 4.2 (AI Skills):
├── Task 42: AI Skill: Task decomposition [unspecified-high]
├── Task 43: AI Skill: Meeting notes → tasks [unspecified-high]
├── Task 44: AI Skill: Invoice draft generation [quick]
├── Task 45: AI Skill: Weekly review summary [quick]
├── Task 46: AI Chat panel in sidebar [visual-engineering]

Wave 4.3 (MCP + integration):
├── Task 47: MCP Server (resources + tools for tasks, time entries, invoices) [deep]
├── Task 48: AI action buttons in UI (decompose, suggest, summarize) [visual-engineering]

Wave 4.4 (Phase 4 completion):
├── Task 49: Phase 4 Docker deployment + AI smoke test [unspecified-high]

=== PHASE 5: POLISH ===
Wave 5.1 (Collaboration):
├── Task 50: Comments/Discussion on tasks [unspecified-high]
├── Task 51: File attachments (MinIO upload, preview, on tasks + invoices) [deep]
├── Task 52: Activity log / audit trail (per entity) [unspecified-high]

Wave 5.2 (Mobile + Automation):
├── Task 53: Mobile responsive polish (all views) [visual-engineering]
├── Task 54: Automation rules engine (5 triggers × 5 actions, no visual builder) [deep]
├── Task 55: Webhooks module (configurable, retry logic, signing) [unspecified-high]

Wave 5.3 (Final):
├── Task 56: Calendar sync (Google Calendar OAuth two-way) [deep]
├── Task 57: Performance optimization + Synology tuning [unspecified-high]
├── Task 58: Final Docker deployment + comprehensive E2E test suite [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
├── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 0 | - | 1-5 | 0.1 |
| 1 | 0 | 6-18 | 1.1 |
| 2 | 0 | 6-18 | 1.1 |
| 3 | 0 | 6-18 | 1.1 |
| 4 | 0 | 18 | 1.1 |
| 5 | 0 | 9 | 1.1 |
| 6 | 2, 3 | 15 | 1.2 |
| 7 | 2 | 13, 14 | 1.2 |
| 8 | 1, 2, 3 | 10, 15 | 1.2 |
| 9 | 5 | 11, 12, 14 | 1.2 |
| 10 | 1, 8 | 11, 12, 13 | 1.3 |
| 11 | 9, 10 | 19 | 1.3 |
| 12 | 9, 10 | 19 | 1.3 |
| 13 | 7, 10 | 14, 16 | 1.3 |
| 14 | 9, 13 | 19 | 1.4 |
| 15 | 6, 8 | 19 | 1.4 |
| 16 | 13 | 17 | 1.4 |
| 17 | 9, 16 | 19 | 1.4 |
| 18 | 4, 9 | 19 | 1.4 |
| 19 | 11-18 | 20-23 | 1.5 |
| 20 | 19 | 21-27 | 2.1 |
| 21 | 20 | 24, 25 | 2.1 |
| 22 | 20 | 25, 28 | 2.1 |
| 23 | 20 | 25 | 2.1 |
| 24 | 9, 21 | 29 | 2.2 |
| 25 | 20-23 | 26, 28, 29 | 2.2 |
| 26 | 13, 25 | 29 | 2.2 |
| 27 | 22 | 28 | 2.2 |
| 28 | 25, 27 | 29, 32 | 2.3 |
| 29 | 24-26, 28 | 32 | 2.3 |
| 30 | 4 | 32 | 2.3 |
| 31 | 10 | 32 | 2.3 |
| 32 | 28-31 | 33-35 | 2.4 |
| 33 | 9, 10, 13 | 39 | 3.1 |
| 34 | 9, 10 | 39 | 3.1 |
| 35 | 9, 15, 16 | 39 | 3.1 |
| 36 | 9, 10 | 39 | 3.2 |
| 37 | 2, 9 | 39 | 3.2 |
| 38 | 4, 30 | 39 | 3.2 |
| 39 | 33-38 | 40-41 | 3.3 |
| 40 | 4 | 42-48 | 4.1 |
| 41 | 9, 40 | 42-48 | 4.1 |
| 42 | 10, 40 | 48, 49 | 4.2 |
| 43 | 10, 40 | 48, 49 | 4.2 |
| 44 | 25, 40 | 49 | 4.2 |
| 45 | 13, 40 | 49 | 4.2 |
| 46 | 9, 40 | 48, 49 | 4.2 |
| 47 | 40 | 49 | 4.3 |
| 48 | 42, 43, 46 | 49 | 4.3 |
| 49 | 47, 48 | 50-52 | 4.4 |
| 50 | 10, 9 | 58 | 5.1 |
| 51 | 10, 25 | 58 | 5.1 |
| 52 | 2 | 58 | 5.1 |
| 53 | 9 | 58 | 5.2 |
| 54 | 4 | 58 | 5.2 |
| 55 | 4 | 58 | 5.2 |
| 56 | 31 | 58 | 5.3 |
| 57 | all | 58 | 5.3 |
| 58 | 50-57 | F1-F4 | 5.3 |

### Agent Dispatch Summary

- **Wave 0.1**: 1 task → `deep`
- **Wave 1.1**: 5 tasks → 3×`quick`, 1×`deep`, 1×`quick`
- **Wave 1.2**: 4 tasks → 1×`unspecified-high`, 1×`quick`, 1×`deep`, 1×`visual-engineering`
- **Wave 1.3**: 4 tasks → 2×`deep`, 2×`visual-engineering`
- **Wave 1.4**: 5 tasks → 3×`visual-engineering`, 1×`unspecified-high`, 1×`visual-engineering`
- **Wave 1.5**: 1 task → `unspecified-high`
- **Wave 2.1-2.4**: 13 tasks across 4 waves
- **Wave 3.1-3.3**: 7 tasks across 3 waves
- **Wave 4.1-4.4**: 10 tasks across 4 waves
- **Wave 5.1-5.3**: 9 tasks across 3 waves
- **FINAL**: 4 → F1:`oracle`, F2:`unspecified-high`, F3:`unspecified-high`, F4:`deep`

---

## TODOs

### === PHASE 0: FOUNDATION ===

- [ ] 0. Walking Skeleton — Monorepo + Docker + Empty Apps

  **What to do**:
  - Initialize pnpm workspace monorepo with Turborepo
  - Create `apps/api` — NestJS app with health endpoint (`GET /api/health`)
  - Create `apps/web` — React Vite app with "Hello FlowPilot" page
  - Create `packages/shared` — shared TypeScript types (empty, with build)
  - Set up PostgreSQL with Prisma (empty schema, connection verified)
  - Set up Redis connection
  - Set up MinIO container
  - Create `docker-compose.yml` with all services (app, postgres, redis, minio, caddy)
  - Create `Dockerfile` for API (multi-stage build) and Web (nginx serve)
  - Set up Vitest in API, Vitest + Playwright in Web
  - Set up ESLint + Prettier across monorepo
  - Set up Caddy as reverse proxy (API at `/api/*`, Web at `/*`)
  - Verify: `docker compose up` → all containers healthy, web accessible, API responds

  **Must NOT do**:
  - No business logic, no entities, no real pages
  - No multi-tenant abstractions
  - No complex CI/CD pipelines

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 0.1 (solo)
  - **Blocks**: Tasks 1-5
  - **Blocked By**: None

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:994-1007` — Synology Docker deploy structure
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:947-1008` — Tech stack details

  **Acceptance Criteria**:
  - [ ] `pnpm install` succeeds from root
  - [ ] `pnpm build` builds all packages without errors
  - [ ] `pnpm test` runs (0 tests, but framework works)
  - [ ] `docker compose up -d` → all containers healthy within 60s

  **QA Scenarios**:
  ```
  Scenario: Docker stack starts cleanly
    Tool: Bash
    Preconditions: Docker installed, no existing containers
    Steps:
      1. Run `docker compose up -d` in project root
      2. Run `docker compose ps` — verify all services "healthy" or "running"
      3. Run `curl http://localhost:3000/api/health` — expect `{"status":"ok"}`
      4. Run `curl http://localhost:3000` — expect HTML containing "FlowPilot"
      5. Run `docker compose exec postgres psql -U flowpilot -c "SELECT 1"` — expect "1"
    Expected Result: All services up, API responds, web serves, DB connected
    Failure Indicators: Any container in "Exit" state, curl timeouts, DB connection refused
    Evidence: .sisyphus/evidence/task-0-docker-stack.txt

  Scenario: Build pipeline works
    Tool: Bash
    Preconditions: Node 20+, pnpm installed
    Steps:
      1. Run `pnpm install` — expect exit code 0
      2. Run `pnpm build` — expect exit code 0, no TypeScript errors
      3. Run `pnpm lint` — expect exit code 0
      4. Run `pnpm test` — expect exit code 0 (0 tests is ok)
    Expected Result: All commands succeed
    Evidence: .sisyphus/evidence/task-0-build-pipeline.txt
  ```

  **Commit**: YES
  - Message: `feat(infra): walking skeleton — monorepo, docker, empty NestJS + React apps`
  - Files: `*` (initial commit)

### === PHASE 1: MVP ===

- [ ] 1. Shared Types Package — All Entity Types & Enums

  **What to do**:
  - Define TypeScript interfaces/types for ALL entities in `packages/shared/src/types/`:
    - `user.ts` — User, UserRole (admin/member/viewer), CreateUserDto, UpdateUserDto
    - `project.ts` — Project, ProjectStatus, BillingType, ProjectMember, CreateProjectDto
    - `task.ts` — Task, TaskStatus, TaskPriority, DependencyType, CreateTaskDto, UpdateTaskDto
    - `time-entry.ts` — TimeEntry, CreateTimeEntryDto
    - `work-type.ts` — WorkType, CreateWorkTypeDto
    - `settings.ts` — Setting, SettingKey enum
    - `api.ts` — ApiResponse<T>, PaginatedResponse<T>, ApiError, PaginationParams
  - Export all from `packages/shared/src/index.ts`
  - Ensure `pnpm build` in shared package produces valid JS + .d.ts

  **Must NOT do**:
  - No Phase 2+ entity types yet (Client, Invoice, etc.)
  - No runtime validation (just types)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Tasks 2-5)
  - **Blocks**: Tasks 6-18
  - **Blocked By**: Task 0

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:132-200` — Project & Task entity attributes
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:272-303` — TimeEntry & WorkType attributes
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:660-671` — API response format

  **Acceptance Criteria**:
  - [ ] `pnpm build --filter=@flowpilot/shared` succeeds
  - [ ] Types importable from `@flowpilot/shared` in both apps/api and apps/web

  **QA Scenarios**:
  ```
  Scenario: Types compile and export correctly
    Tool: Bash
    Preconditions: Task 0 complete
    Steps:
      1. Run `pnpm build --filter=@flowpilot/shared`
      2. Check `packages/shared/dist/index.d.ts` exists and contains exported types
      3. In apps/api, create temp file importing `{ Project } from '@flowpilot/shared'` → `tsc --noEmit` passes
    Expected Result: Build succeeds, types available in consuming packages
    Evidence: .sisyphus/evidence/task-1-types-build.txt
  ```

  **Commit**: YES
  - Message: `feat(shared): define all Phase 1 entity types and API contracts`
  - Files: `packages/shared/src/**`

- [ ] 2. Prisma Schema — All Phase 1 Entities

  **What to do**:
  - Create `apps/api/prisma/schema.prisma` with all Phase 1 models:
    - User (id UUID, email, name, passwordHash, role enum, avatarUrl, createdAt, updatedAt)
    - Project (id UUID, name, clientId nullable, status enum, billingType enum, budgetHours, budgetAmount, hourlyRateDefault, startsAt, endsAt, tags Json, description, soft delete)
    - ProjectMember (userId, projectId, role enum, composite PK)
    - Task (id UUID, projectId FK, parentTaskId self-FK, name, description, status enum, priority enum, assigneeId FK, reporterId FK, estimatedHours, dueDate, startDate, trackTime bool, billingType, workTypeId FK, position int, labels Json, customFields Json, timestamps, doneAt)
    - TaskDependency (taskId, dependsOnId, type enum)
    - TimeEntry (id UUID, taskId nullable FK, projectId FK, userId FK, workTypeId FK, description, startedAt, endedAt nullable, durationMinutes int, isBillable bool, timestamps)
    - WorkType (id UUID, name, hourlyRate decimal, color, isActive bool)
    - Setting (id, key unique, value text, type string, updatedAt)
  - Run `prisma migrate dev --name init` → generate migration
  - Seed file with: default admin user, default work types, default settings

  **Must NOT do**:
  - No Phase 2 entities (Client, Invoice, etc.)
  - No row-level security

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Tasks 1, 3-5)
  - **Blocks**: Tasks 6-18
  - **Blocked By**: Task 0

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:132-200` — Project & Task entity attributes
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:272-303` — TimeEntry & WorkType attributes
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:883-943` — ER Diagram

  **Acceptance Criteria**:
  - [ ] `prisma migrate dev` creates all tables without errors
  - [ ] `prisma db seed` populates default data
  - [ ] `prisma generate` produces client with correct types

  **QA Scenarios**:
  ```
  Scenario: Database migration and seed
    Tool: Bash
    Preconditions: PostgreSQL running (docker compose)
    Steps:
      1. Run `pnpm --filter=@flowpilot/api prisma migrate dev --name init`
      2. Run `pnpm --filter=@flowpilot/api prisma db seed`
      3. Run `docker compose exec postgres psql -U flowpilot -c "SELECT count(*) FROM \"User\""` — expect >= 1
      4. Run `docker compose exec postgres psql -U flowpilot -c "SELECT count(*) FROM \"WorkType\""` — expect >= 3
    Expected Result: All tables created, seed data present
    Evidence: .sisyphus/evidence/task-2-prisma-migration.txt

  Scenario: Schema validates all entity relations
    Tool: Bash
    Steps:
      1. Run `prisma validate` — expect no errors
      2. Run `prisma format` — expect no changes (already formatted)
    Expected Result: Schema is valid and formatted
    Evidence: .sisyphus/evidence/task-2-schema-validate.txt
  ```

  **Commit**: YES
  - Message: `feat(db): Prisma schema with all Phase 1 entities + seed data`
  - Files: `apps/api/prisma/**`

- [ ] 3. Auth Module — Register, Login, JWT, Guards

  **What to do**:
  - NestJS Auth module in `apps/api/src/auth/`:
    - `POST /api/auth/register` — create user (email, password, name), hash password (bcrypt cost 12)
    - `POST /api/auth/login` — validate credentials, return { accessToken (15min JWT), refreshToken (7d) }
    - `POST /api/auth/refresh` — exchange refresh token for new access token
    - `POST /api/auth/logout` — invalidate refresh token
    - `GET /api/auth/me` — return current user
  - JWT strategy (Passport.js) with NestJS guard
  - `@Roles()` decorator + RolesGuard for admin/member/viewer
  - `@Public()` decorator to skip auth on specific endpoints
  - Store refresh tokens in Redis (hashed, with expiry)
  - Rate limiting on login: 5 attempts per minute per IP

  **Must NOT do**:
  - No OAuth/SSO
  - No email verification (Phase 5)
  - No password reset flow yet

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 6-18
  - **Blocked By**: Task 0

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:653-659` — Auth design (API keys, JWT, OAuth)
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1019-1027` — Security requirements

  **Acceptance Criteria**:
  - [ ] `curl -X POST /api/auth/register` creates user and returns 201
  - [ ] `curl -X POST /api/auth/login` returns JWT tokens
  - [ ] `curl -H "Authorization: Bearer <token>" /api/auth/me` returns user
  - [ ] Expired token → 401
  - [ ] Wrong password → 401 with proper error format
  - [ ] Rate limiting works: 6th login attempt in 1 minute → 429

  **QA Scenarios**:
  ```
  Scenario: Full auth flow (register → login → me → refresh → logout)
    Tool: Bash (curl)
    Preconditions: API running, DB migrated + seeded
    Steps:
      1. POST /api/auth/register {"email":"test@test.cz","password":"Test1234!","name":"Test"} → expect 201, body has user.id
      2. POST /api/auth/login {"email":"test@test.cz","password":"Test1234!"} → expect 200, body has accessToken + refreshToken
      3. GET /api/auth/me with Bearer <accessToken> → expect 200, body has email "test@test.cz"
      4. POST /api/auth/refresh {"refreshToken":"<token>"} → expect 200, new accessToken
      5. POST /api/auth/logout with Bearer <accessToken> → expect 200
      6. POST /api/auth/refresh with old refreshToken → expect 401
    Expected Result: Full lifecycle works, logout invalidates refresh
    Evidence: .sisyphus/evidence/task-3-auth-flow.txt

  Scenario: Auth failures
    Tool: Bash (curl)
    Steps:
      1. POST /api/auth/login {"email":"test@test.cz","password":"wrong"} → expect 401, body.error.code = "INVALID_CREDENTIALS"
      2. GET /api/auth/me without token → expect 401
      3. GET /api/auth/me with expired/invalid token → expect 401
    Expected Result: All failure cases return proper error format
    Evidence: .sisyphus/evidence/task-3-auth-failures.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): JWT auth with register, login, refresh, logout, role guards`
  - Files: `apps/api/src/auth/**`

- [ ] 4. Settings Module — Key-Value Store + API

  **What to do**:
  - NestJS Settings module in `apps/api/src/settings/`:
    - `GET /api/settings` — list all settings (admin only)
    - `GET /api/settings/:key` — get single setting
    - `PUT /api/settings/:key` — update setting (admin only)
    - `PUT /api/settings/bulk` — update multiple settings at once
  - Settings stored in DB table: key (unique), value (text), type (string|number|boolean|json)
  - Type coercion on read (return proper types, not all strings)
  - Cache in Redis (invalidate on write)
  - Default settings seeded: app.name, app.locale, app.timezone, app.currency, invoice.numberFormat, invoice.defaultPaymentTermsDays, timeTracking.autoStopHours, timeTracking.roundingMinutes

  **Must NOT do**:
  - No complex settings UI (just API for now, UI in Task 18)
  - No per-user settings yet (global only for now)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Tasks 1-3, 5)
  - **Blocks**: Task 18
  - **Blocked By**: Task 0

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:626-636` — AI Configuration (settings pattern)

  **Acceptance Criteria**:
  - [ ] `GET /api/settings` returns all settings with correct types
  - [ ] `PUT /api/settings/app.locale` updates and subsequent GET returns new value
  - [ ] Non-admin user gets 403 on PUT

  **QA Scenarios**:
  ```
  Scenario: Settings CRUD
    Tool: Bash (curl)
    Steps:
      1. GET /api/settings with admin token → expect 200, array of settings with key/value/type
      2. PUT /api/settings/app.locale {"value":"en"} with admin token → expect 200
      3. GET /api/settings/app.locale → expect value "en"
      4. PUT /api/settings/app.locale {"value":"en"} with member token → expect 403
    Expected Result: CRUD works, RBAC enforced
    Evidence: .sisyphus/evidence/task-4-settings.txt
  ```

  **Commit**: YES
  - Message: `feat(settings): key-value settings module with cache and RBAC`
  - Files: `apps/api/src/settings/**`

- [ ] 5. i18n Setup — CZ + EN

  **What to do**:
  - Backend: `nestjs-i18n` package, translation files in `apps/api/src/i18n/{cs,en}/*.json`
    - Error messages, validation messages, email templates
    - Accept-Language header detection + user preference override
  - Frontend: `react-i18next` + `i18next-http-backend`
    - Translation files in `apps/web/public/locales/{cs,en}/*.json`
    - Language switcher component
    - All hardcoded strings extracted to translation keys
  - Shared: translation key constants in `packages/shared/src/i18n-keys.ts`

  **Must NOT do**:
  - No RTL support
  - No auto-translation
  - Only CZ + EN, no other languages

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.1 (with Tasks 1-4)
  - **Blocks**: Task 9
  - **Blocked By**: Task 0

  **References**:
  - No direct reference in spec, but user confirmed CZ + EN from start

  **Acceptance Criteria**:
  - [ ] API error messages returned in requested language (Accept-Language header)
  - [ ] Frontend renders in Czech by default, switches to English

  **QA Scenarios**:
  ```
  Scenario: i18n language switching
    Tool: Bash (curl) + Playwright
    Steps:
      1. curl POST /api/auth/login with invalid credentials -H "Accept-Language: cs" → error message in Czech
      2. curl POST /api/auth/login with invalid credentials -H "Accept-Language: en" → error message in English
      3. Playwright: open app → verify Czech UI text (buttons, labels, headings) → click language switcher → verify English UI text
    Expected Result: Error messages respect Accept-Language; frontend renders both CZ and EN
    Evidence: .sisyphus/evidence/task-5-i18n.txt
  ```

  **Commit**: YES
  - Message: `feat(i18n): Czech + English translations for API and web`
  - Files: `apps/api/src/i18n/**`, `apps/web/public/locales/**`, `packages/shared/src/i18n-keys.ts`

### --- Wave 1.2: Core Modules ---

- [ ] 6. Users Module — CRUD, Profile, Avatar

  **What to do**:
  - NestJS module `apps/api/src/users/`:
    - `GET /api/users` — list users (admin only), paginated
    - `GET /api/users/:id` — get user (admin or self)
    - `PUT /api/users/:id` — update user (admin or self, role change admin-only)
    - `DELETE /api/users/:id` — soft delete (admin only)
    - `GET /api/users/me` — alias for current user
    - `PUT /api/users/me` — update own profile
    - `PUT /api/users/me/settings` — per-user settings (locale, timezone, notifications prefs)
    - `POST /api/users/me/avatar` — upload avatar (store in MinIO)
  - Input validation with class-validator + class-transformer
  - Response follows ApiResponse<T> format from shared types

  **Must NOT do**:
  - No user invitation flow
  - No email-based password reset

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Tasks 7, 8, 9)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 3

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:773-780` — Users API endpoints
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:660-671` — API response format

  **Acceptance Criteria**:
  - [ ] All CRUD endpoints work with proper pagination
  - [ ] Avatar upload stores file in MinIO, returns URL
  - [ ] Non-admin cannot list users or delete users
  - [ ] User can update own profile but not own role

  **QA Scenarios**:
  ```
  Scenario: User CRUD + RBAC
    Tool: Bash (curl)
    Steps:
      1. GET /api/users with admin token → expect 200, paginated list
      2. PUT /api/users/me {"name":"Updated"} with member token → expect 200
      3. PUT /api/users/<admin-id> {"role":"viewer"} with member token → expect 403
      4. DELETE /api/users/<member-id> with admin token → expect 200
      5. GET /api/users/<deleted-id> → expect 404
    Expected Result: CRUD works, RBAC enforced at field level
    Evidence: .sisyphus/evidence/task-6-users-crud.txt
  ```

  **Commit**: YES
  - Message: `feat(users): user CRUD with avatar upload and per-user settings`
  - Files: `apps/api/src/users/**`

- [ ] 7. Work Types Module — CRUD, Rates, Colors

  **What to do**:
  - NestJS module `apps/api/src/work-types/`:
    - `GET /api/work-types` — list (active only by default, `?includeInactive=true`)
    - `POST /api/work-types` — create (admin only)
    - `PUT /api/work-types/:id` — update (admin only)
    - `DELETE /api/work-types/:id` — soft delete / deactivate (admin only)
  - Fields: name, hourlyRate (Decimal), color (hex string), isActive
  - Validate: hourlyRate > 0, color valid hex, name unique
  - Seed defaults: Programování (1500 CZK, blue), Administrativa (500 CZK, gray), Konzultace (1500 CZK, green), Design (1200 CZK, purple), Testování (900 CZK, orange)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Tasks 6, 8, 9)
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Task 2

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:292-303` — WorkType entity
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:747-753` — Work Types API

  **Acceptance Criteria**:
  - [ ] CRUD works, validation enforced
  - [ ] Default work types seeded
  - [ ] Deactivated types hidden from default list

  **QA Scenarios**:
  ```
  Scenario: Work Types lifecycle
    Tool: Bash (curl)
    Steps:
      1. GET /api/work-types → expect seeded types (>=5)
      2. POST /api/work-types {"name":"DevOps","hourlyRate":1800,"color":"#FF5733"} → expect 201
      3. PUT /api/work-types/<id> {"hourlyRate":2000} → expect 200
      4. DELETE /api/work-types/<id> → expect 200
      5. GET /api/work-types → expect type not in list
      6. GET /api/work-types?includeInactive=true → expect type in list with isActive=false
    Expected Result: Full lifecycle with soft delete
    Evidence: .sisyphus/evidence/task-7-work-types.txt
  ```

  **Commit**: YES
  - Message: `feat(work-types): CRUD with rates, colors, soft delete`
  - Files: `apps/api/src/work-types/**`

- [ ] 8. Projects Module — CRUD, Templates, Clone, Archive

  **What to do**:
  - NestJS module `apps/api/src/projects/`:
    - `GET /api/projects` — list with filters (status, tags), paginated
    - `POST /api/projects` — create (optionally from template)
    - `GET /api/projects/:id` — get with stats (budget vs actual)
    - `PUT /api/projects/:id` — update
    - `DELETE /api/projects/:id` — soft delete / archive
    - `GET /api/projects/:id/stats` — budget vs actual hours/amount, task completion %
    - `POST /api/projects/:id/clone` — clone project structure (tasks, not time entries)
    - `POST /api/projects/:id/members` — add member with role
    - `DELETE /api/projects/:id/members/:userId` — remove member
  - Project templates: stored as special projects with `isTemplate=true`
  - Project-level RBAC: only members can access project data
  - Tags: JSON array, searchable via `@>` operator

  **Must NOT do**:
  - No custom fields on projects
  - No project-level workflow customization yet

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Tasks 6, 7, 9)
  - **Blocks**: Tasks 10, 15
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:132-170` — Project entity + functions
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:686-695` — Projects API endpoints

  **Acceptance Criteria**:
  - [ ] CRUD with pagination and filters works
  - [ ] Clone copies tasks structure but not time entries
  - [ ] Project members can access, non-members get 403
  - [ ] Stats endpoint returns correct budget vs actual

  **QA Scenarios**:
  ```
  Scenario: Project lifecycle with clone and members
    Tool: Bash (curl)
    Steps:
      1. POST /api/projects {"name":"Test Project","billingType":"time_and_materials","budgetHours":100} → 201
      2. POST /api/projects/<id>/members {"userId":"<member-id>","role":"member"} → 200
      3. GET /api/projects/<id> with member token → 200
      4. GET /api/projects/<id> with non-member token → 403
      5. POST /api/projects/<id>/clone {"name":"Cloned Project"} → 201, new ID
      6. DELETE /api/projects/<id> → 200 (archived)
      7. GET /api/projects?status=active → cloned project in list, original not
    Expected Result: Full lifecycle with access control
    Evidence: .sisyphus/evidence/task-8-projects.txt
  ```

  **Commit**: YES
  - Message: `feat(projects): CRUD with templates, clone, members, archive`
  - Files: `apps/api/src/projects/**`

- [ ] 9. React App Shell — Layout, Routing, Theme, Sidebar, Keyboard Nav

  **What to do**:
  - Set up React app structure in `apps/web/src/`:
    - `app/` — routes (react-router-dom v6)
    - `components/` — shared UI components
    - `features/` — feature modules (empty for now, structure only)
    - `hooks/` — custom hooks
    - `lib/` — utilities, API client (axios/fetch wrapper)
    - `stores/` — Zustand stores
  - Linear-inspired design system:
    - Dark theme (default) + light theme toggle
    - CSS variables for colors, spacing, typography
    - Tailwind CSS setup with custom theme
    - shadcn/ui components (Button, Input, Select, Dialog, Dropdown, Toast, Table, Tabs)
  - App layout:
    - Left sidebar (collapsible): navigation links (Dashboard, Projects, Tasks, Time, Reports, Settings)
    - Top bar: search (Cmd+K), timer widget placeholder, user menu, notifications bell
    - Main content area with breadcrumbs
  - Routing:
    - `/` → Dashboard (placeholder)
    - `/projects` → Projects list (placeholder)
    - `/projects/:id` → Project detail (placeholder)
    - `/tasks` → My Tasks (placeholder)
    - `/time` → Time tracking (placeholder)
    - `/reports` → Reports (placeholder)
    - `/settings` → Settings (placeholder)
    - `/login` → Login page (functional, connects to auth API)
    - `/register` → Register page (functional)
  - Auth integration:
    - Zustand auth store (login, logout, refresh, current user)
    - Protected route wrapper (redirect to /login if not authenticated)
    - API client with automatic token refresh on 401
  - Keyboard navigation:
    - Cmd+K → search overlay
    - Cmd+Shift+P → command palette (empty, structure only)
    - Escape → close modals/overlays
  - i18n: language switcher in user menu

  **Must NOT do**:
  - No actual feature pages (just placeholders with titles)
  - No complex state management beyond auth
  - No animations/transitions yet

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.2 (with Tasks 6, 7, 8)
  - **Blocks**: Tasks 11, 12, 14
  - **Blocked By**: Task 5

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:960-966` — Frontend tech stack
  - Linear app UI as design reference (dark, minimal, keyboard-first)

  **Acceptance Criteria**:
  - [ ] Login/register pages work (create account, log in, see dashboard)
  - [ ] Sidebar navigation works, all routes render placeholder pages
  - [ ] Dark/light theme toggle works
  - [ ] Cmd+K opens search overlay
  - [ ] Language switcher changes UI language
  - [ ] Unauthorized access redirects to /login

  **QA Scenarios**:
  ```
  Scenario: Login flow and navigation
    Tool: Playwright
    Preconditions: API running with seeded admin user
    Steps:
      1. Navigate to http://localhost:3000
      2. Expect redirect to /login
      3. Fill input[name="email"] with "admin@local"
      4. Fill input[name="password"] with "admin"
      5. Click button[type="submit"]
      6. Expect URL to be "/" (dashboard)
      7. Verify sidebar contains links: "Projects", "Tasks", "Time", "Reports", "Settings"
      8. Click "Projects" link → expect URL "/projects"
      9. Screenshot
    Expected Result: Login works, navigation renders all routes
    Evidence: .sisyphus/evidence/task-9-app-shell.png

  Scenario: Keyboard shortcuts and theme
    Tool: Playwright
    Steps:
      1. Press Cmd+K → expect search overlay visible
      2. Press Escape → expect overlay hidden
      3. Find theme toggle button → click → verify body class changes (dark ↔ light)
    Expected Result: Keyboard shortcuts and theme toggle functional
    Evidence: .sisyphus/evidence/task-9-keyboard-theme.png
  ```

  **Commit**: YES
  - Message: `feat(web): React app shell with Linear-style layout, auth, routing, keyboard nav`
  - Files: `apps/web/src/**`

### --- Wave 1.3: Tasks + Time Tracking ---

- [ ] 10. Tasks Module — CRUD + Subtasks + Dependencies

  **What to do**:
  - NestJS module `apps/api/src/tasks/`:
    - `GET /api/projects/:projectId/tasks` — list with filters (status, assignee, priority, dueDate range), paginated, sortable
    - `POST /api/projects/:projectId/tasks` — create task
    - `GET /api/tasks/:id` — get with subtasks, dependencies, time summary
    - `PUT /api/tasks/:id` — update (partial update via PATCH semantics)
    - `DELETE /api/tasks/:id` — soft delete
    - `PUT /api/tasks/:id/move` — change status (kanban move), validate workflow transitions
    - `PUT /api/tasks/reorder` — bulk reorder (position update for multiple tasks)
    - `GET /api/tasks/:id/subtasks` — list subtasks
    - `POST /api/tasks/:id/subtasks` — create subtask (inherits assignee, labels, workType from parent)
    - `POST /api/tasks/:id/dependencies` — add dependency
    - `DELETE /api/tasks/:id/dependencies/:depId` — remove dependency
    - `GET /api/tasks/my` — current user's assigned tasks across all projects
  - Subtasks: recursive self-FK, max 3 depth enforced, parent aggregates estimated/actual hours
  - Dependencies: finish_to_start, start_to_start, finish_to_finish types
  - Task workflow: configurable status list per project (stored in project settings), default: backlog→todo→in_progress→review→done
  - Circular dependency detection (DFS check on add)

  **Must NOT do**:
  - No visual workflow builder
  - No automatic date shifting on dependency changes (manual only)
  - No task comments (Phase 5)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.3 (with Tasks 11, 12, 13)
  - **Blocks**: Tasks 11, 12, 13
  - **Blocked By**: Tasks 1, 8

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:176-267` — Task entity, dependencies, workflow, views
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:696-708` — Tasks API

  **Acceptance Criteria**:
  - [ ] CRUD + subtasks + dependencies all work
  - [ ] Circular dependency rejected
  - [ ] Parent task aggregates child hours
  - [ ] `/api/tasks/my` returns across all user's projects

  **QA Scenarios**:
  ```
  Scenario: Task CRUD with subtasks and dependencies
    Tool: Bash (curl)
    Steps:
      1. POST /api/projects/<id>/tasks {"name":"Parent Task","estimatedHours":10} → 201
      2. POST /api/tasks/<parentId>/subtasks {"name":"Sub 1","estimatedHours":3} → 201
      3. POST /api/tasks/<parentId>/subtasks {"name":"Sub 2","estimatedHours":5} → 201
      4. GET /api/tasks/<parentId> → expect subtasks array length 2
      5. POST second parent task, then POST dependency from task2 → task1 (finish_to_start) → 201
      6. POST dependency from task1 → task2 → expect 400 (circular)
    Expected Result: Subtasks aggregate, dependencies validate
    Evidence: .sisyphus/evidence/task-10-tasks-crud.txt
  ```

  **Commit**: YES
  - Message: `feat(tasks): CRUD with subtasks, dependencies, workflow, reorder`
  - Files: `apps/api/src/tasks/**`

- [ ] 11. Tasks Kanban View

  **What to do**:
  - React component in `apps/web/src/features/tasks/views/KanbanView.tsx`:
    - Columns = workflow statuses (fetched from project settings)
    - Cards: task title, assignee avatar, due date badge (red if overdue), priority indicator (color dot), estimate vs actual hours
    - Drag-and-drop between columns using `@dnd-kit/core`
    - On drop: call `PUT /api/tasks/:id/move` with new status
    - Quick filters bar: My Tasks, Due Today, Due This Week, Overdue
    - Card click → task detail side panel (slide-over from right)
    - Task detail panel: edit all fields inline, view subtasks, add time entry
    - New task: "+" button at bottom of each column → inline card creation
  - Optimistic updates: move card immediately, revert on API error
  - Loading states: skeleton cards while fetching

  **Must NOT do**:
  - No WIP limits
  - No swimlanes
  - No column customization (columns = statuses)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.3 (with Tasks 10, 12, 13)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 9, 10

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:238-244` — Kanban Board spec

  **Acceptance Criteria**:
  - [ ] Columns render per workflow statuses
  - [ ] Drag-drop moves task and persists
  - [ ] Filters work (My Tasks, overdue, etc.)
  - [ ] Task detail panel opens on card click

  **QA Scenarios**:
  ```
  Scenario: Kanban drag and drop
    Tool: Playwright
    Preconditions: Project with tasks in different statuses
    Steps:
      1. Navigate to /projects/<id> → Kanban view
      2. Verify columns match workflow statuses
      3. Drag task card from "To Do" column to "In Progress" column
      4. Verify card appears in "In Progress"
      5. Refresh page → verify task is still in "In Progress"
      6. Click on task card → verify side panel opens with task details
      7. Screenshot
    Expected Result: Drag-drop persists, detail panel works
    Evidence: .sisyphus/evidence/task-11-kanban.png
  ```

  **Commit**: YES
  - Message: `feat(web): Kanban board with drag-drop, filters, task detail panel`
  - Files: `apps/web/src/features/tasks/views/KanbanView.tsx`, `apps/web/src/features/tasks/components/**`

- [ ] 12. Tasks List View — Table, Inline Edit, Bulk Actions

  **What to do**:
  - React component `apps/web/src/features/tasks/views/ListView.tsx`:
    - Table columns: checkbox, name, assignee, status, priority, due date, estimated hours, actual hours
    - Inline editing: double-click cell → edit (status dropdown, date picker, text input)
    - Sort: click column header (asc/desc/none)
    - Group by: status, assignee, priority, due date (dropdown selector)
    - Filter bar: status, assignee, priority, due date range, search text
    - Bulk actions: select multiple → change status, change assignee, delete
    - Drag-and-drop row reorder (within group)
    - Pagination: 25/50/100 per page
  - Use TanStack Table (react-table) for table logic
  - Keyboard: arrow keys navigate cells, Enter starts edit, Escape cancels

  **Must NOT do**:
  - No column resize/reorder
  - No custom columns

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.3 (with Tasks 10, 11, 13)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 9, 10

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:229-236` — List View spec

  **Acceptance Criteria**:
  - [ ] Table renders with all columns, data from API
  - [ ] Inline edit works for status, assignee, due date
  - [ ] Sort by any column
  - [ ] Bulk select + status change works
  - [ ] Group by status/assignee works

  **QA Scenarios**:
  ```
  Scenario: List view with inline edit and bulk actions
    Tool: Playwright
    Steps:
      1. Navigate to project → switch to List view
      2. Double-click on status cell → select "In Progress" from dropdown → verify saved
      3. Click column header "Due Date" → verify rows reorder
      4. Select 3 checkboxes → click "Change Status" bulk action → select "Done" → verify all 3 updated
      5. Screenshot
    Expected Result: Inline edit and bulk actions work
    Evidence: .sisyphus/evidence/task-12-list-view.png
  ```

  **Commit**: YES
  - Message: `feat(web): task list view with inline edit, sort, group, bulk actions`
  - Files: `apps/web/src/features/tasks/views/ListView.tsx`

- [ ] 13. Time Tracking Module — CRUD + Timer

  **What to do**:
  - NestJS module `apps/api/src/time-entries/`:
    - `GET /api/time-entries` — list with filters (dateFrom, dateTo, userId, projectId, taskId, isBillable), paginated
    - `POST /api/time-entries` — create manual entry
    - `PUT /api/time-entries/:id` — update
    - `DELETE /api/time-entries/:id` — delete
    - `POST /api/time-entries/start` — start timer (creates entry with startedAt, no endedAt)
    - `POST /api/time-entries/stop` — stop running timer (sets endedAt, computes durationMinutes)
    - `GET /api/time-entries/running` — get current running timer (if any)
    - `GET /api/time-entries/report` — aggregated report (group by project, user, workType, date)
  - Business logic:
    - Only one running timer per user at a time
    - Timer across midnight: split into two entries (one per day)
    - Duration computed: endedAt - startedAt in minutes, rounded per settings (timeTracking.roundingMinutes)
    - Billing amount computed: durationHours × workType.hourlyRate (or task/project override)
    - Cannot edit entries linked to invoices (invoice_id not null)

  **Must NOT do**:
  - No bulk entry endpoint (UI handles multiple POSTs)
  - No calendar-based time entry creation

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.3 (with Tasks 10, 11, 12)
  - **Blocks**: Tasks 14, 16
  - **Blocked By**: Tasks 7, 10

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:272-333` — TimeEntry entity, tracking flow
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:710-720` — Time Entries API

  **Acceptance Criteria**:
  - [ ] Manual entry CRUD works
  - [ ] Timer start/stop works, duration computed correctly
  - [ ] Only one running timer per user
  - [ ] Report aggregation returns correct sums
  - [ ] Midnight split works correctly

  **QA Scenarios**:
  ```
  Scenario: Timer start/stop lifecycle
    Tool: Bash (curl)
    Steps:
      1. POST /api/time-entries/start {"projectId":"<id>","workTypeId":"<id>","description":"Coding"} → 201
      2. GET /api/time-entries/running → expect entry with startedAt, no endedAt
      3. POST /api/time-entries/start → expect 400 (already running)
      4. Wait 2 seconds, POST /api/time-entries/stop → 200, entry has endedAt and durationMinutes > 0
      5. GET /api/time-entries/running → expect null/empty
    Expected Result: Timer lifecycle with single-timer enforcement
    Evidence: .sisyphus/evidence/task-13-timer.txt

  Scenario: Manual entry and report
    Tool: Bash (curl)
    Steps:
      1. POST /api/time-entries {"projectId":"<id>","workTypeId":"<id>","startedAt":"2026-04-20T09:00:00Z","endedAt":"2026-04-20T11:30:00Z","isBillable":true} → 201
      2. GET /api/time-entries/report?projectId=<id>&groupBy=workType → expect sum of 150 minutes
    Expected Result: Manual entry saved, report aggregates correctly
    Evidence: .sisyphus/evidence/task-13-time-report.txt
  ```

  **Commit**: YES
  - Message: `feat(time): time tracking CRUD with timer, midnight split, reporting`
  - Files: `apps/api/src/time-entries/**`

### --- Wave 1.4: Integration + Reports ---

- [ ] 14. Time Tracking UI — Timer Widget, Manual Entry, Bulk Entry

  **What to do**:
  - Global timer widget in top bar:
    - Shows running timer: project name, task name, elapsed time (HH:MM:SS live)
    - Start button (opens dropdown: select project, task, work type)
    - Stop button → timer stops, entry saved
    - Click on timer → opens time entry detail for editing
  - Time tracking page (`/time`):
    - Weekly timesheet view: days as columns, projects as rows, cells show hours
    - Click cell → add/edit time entry for that day/project
    - Manual entry form: date, project (dropdown), task (dropdown filtered by project), work type, description, start time, end time OR duration
    - Bulk entry: table with multiple rows, add row button, submit all at once
    - Daily total in footer
  - Calendar view of time entries: blocks on timeline showing what was worked on when

  **Must NOT do**:
  - No drag-to-create on calendar (just display)
  - No Excel copy-paste

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.4 (with Tasks 15-18)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 9, 13

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:307-323` — Time tracking flow (timer, manual, bulk, calendar)

  **Acceptance Criteria**:
  - [ ] Timer in top bar starts/stops, shows live elapsed time
  - [ ] Manual entry form creates entry via API
  - [ ] Weekly timesheet displays hours per project/day
  - [ ] Bulk entry submits multiple entries

  **QA Scenarios**:
  ```
  Scenario: Timer widget lifecycle
    Tool: Playwright
    Steps:
      1. Click start timer button in top bar
      2. Select project and work type from dropdown
      3. Verify timer shows "00:00:01" and counting up
      4. Wait 3 seconds → verify timer shows ~"00:00:03"
      5. Click stop → verify timer disappears, entry appears in /time page
      6. Screenshot
    Expected Result: Live timer works end-to-end
    Evidence: .sisyphus/evidence/task-14-timer-widget.png
  ```

  **Commit**: YES
  - Message: `feat(web): time tracking UI with timer widget, manual entry, weekly timesheet`
  - Files: `apps/web/src/features/time/**`

- [ ] 15. Project Dashboard — Budget vs Actual, Progress

  **What to do**:
  - React page `apps/web/src/features/projects/ProjectDashboard.tsx`:
    - Header: project name, client, status badge, billing type
    - Budget widget: hours used vs budget (progress bar, % text), amount used vs budget
    - Task completion: total tasks, done tasks, % complete (donut chart)
    - Time breakdown: pie chart by work type (hours + amounts)
    - Recent activity: last 10 time entries, last 5 status changes
    - Team members: avatars with hours logged per member
    - Overdue tasks list: tasks past due date
  - All data from existing API endpoints (`/projects/:id/stats`, `/time-entries/report`, etc.)
  - Charts: use Recharts (React-native, lightweight)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.4 (with Tasks 14, 16-18)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 6, 8

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:519-548` — Reports & Analytics
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1049-1053` — Morning Standup Flow

  **Acceptance Criteria**:
  - [ ] Dashboard renders with all widgets populated
  - [ ] Budget progress bar shows correct %
  - [ ] Charts render with real data

  **QA Scenarios**:
  ```
  Scenario: Project dashboard with data
    Tool: Playwright
    Preconditions: Project with tasks and time entries
    Steps:
      1. Navigate to /projects/<id>
      2. Verify budget widget shows progress bar with correct hours
      3. Verify task completion donut chart renders
      4. Verify time breakdown pie chart shows work types
      5. Screenshot
    Expected Result: All widgets render with correct data
    Evidence: .sisyphus/evidence/task-15-project-dashboard.png
  ```

  **Commit**: YES
  - Message: `feat(web): project dashboard with budget, progress, charts`
  - Files: `apps/web/src/features/projects/ProjectDashboard.tsx`

- [ ] 16. Basic Reports API — Timesheet, Project Stats, Utilization

  **What to do**:
  - NestJS reports module `apps/api/src/reports/`:
    - `GET /api/reports/timesheet` — user timesheet (params: userId, dateFrom, dateTo, groupBy=day|week|month)
      Returns: array of { period, totalHours, billableHours, entries[] }
    - `GET /api/reports/project/:id` — project financial summary
      Returns: { totalHours, billableHours, totalAmount, invoicedAmount, uninvoicedAmount, byWorkType[] }
    - `GET /api/reports/billing` — unbilled time entries across all projects
      Returns: grouped by project { project, unbilledHours, unbilledAmount, entries[] }
    - `GET /api/reports/utilization` — user utilization (params: dateFrom, dateTo)
      Returns: per-user { totalHours, billableHours, utilizationPercent }
  - All endpoints support `format` query param: json (default), csv
  - CSV export: proper headers, UTF-8 BOM for Czech characters

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.4 (with Tasks 14, 15, 17, 18)
  - **Blocks**: Task 17
  - **Blocked By**: Task 13

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:519-548` — Reports types
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:755-762` — Reports API

  **Acceptance Criteria**:
  - [ ] Timesheet returns grouped data with correct hours
  - [ ] Project report shows financial summary
  - [ ] CSV export works with Czech characters

  **QA Scenarios**:
  ```
  Scenario: Reports with real data
    Tool: Bash (curl)
    Preconditions: Time entries exist across projects
    Steps:
      1. GET /api/reports/timesheet?userId=<id>&dateFrom=2026-04-01&dateTo=2026-04-30&groupBy=week → expect weekly breakdown
      2. GET /api/reports/project/<id> → expect totalHours, billableHours, byWorkType array
      3. GET /api/reports/utilization?dateFrom=2026-04-01&dateTo=2026-04-30 → expect utilizationPercent between 0-100
      4. GET /api/reports/timesheet?format=csv → expect CSV with BOM, proper headers
    Expected Result: All reports return correct aggregated data
    Evidence: .sisyphus/evidence/task-16-reports-api.txt
  ```

  **Commit**: YES
  - Message: `feat(reports): timesheet, project financial, utilization, CSV export`
  - Files: `apps/api/src/reports/**`

- [ ] 17. Reports UI — Timesheet View, Charts

  **What to do**:
  - Reports page (`/reports`) with tabs:
    - **Timesheet**: date range picker, user selector, group by toggle (day/week/month), table + bar chart
    - **Project**: project selector, financial summary cards, pie chart by work type
    - **Utilization**: date range, bar chart per user (billable vs non-billable)
    - **Unbilled**: table of unbilled entries grouped by project, total amount
  - Export button: CSV download for current view
  - Date range presets: This Week, This Month, Last Month, This Quarter, Custom
  - Charts: Recharts (bar, pie, line)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.4 (with Tasks 14-16, 18)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 9, 16

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:519-548` — Reports types and visualizations

  **Acceptance Criteria**:
  - [ ] All report tabs render with data
  - [ ] Charts display correctly
  - [ ] CSV export downloads file

  **QA Scenarios**:
  ```
  Scenario: Reports page navigation and data
    Tool: Playwright
    Steps:
      1. Navigate to /reports
      2. Select "Timesheet" tab → verify table with hours
      3. Change date range to "This Month" → verify data updates
      4. Click "CSV Export" → verify file downloads
      5. Switch to "Utilization" tab → verify bar chart renders
      6. Screenshot
    Expected Result: All report views render correctly
    Evidence: .sisyphus/evidence/task-17-reports-ui.png
  ```

  **Commit**: YES
  - Message: `feat(web): reports UI with timesheet, utilization, charts, CSV export`
  - Files: `apps/web/src/features/reports/**`

- [ ] 18. Settings UI Page

  **What to do**:
  - Settings page (`/settings`) with sections:
    - **General**: app name, locale (CZ/EN), timezone, currency
    - **Work Types**: CRUD table (name, rate, color, active toggle) — uses Work Types API
    - **Project Defaults**: default billing type, default budget hours, default payment terms
    - **Time Tracking**: auto-stop after X hours, rounding (1min/5min/15min/30min), default work type
    - **Invoice**: number format (pattern with {YYYY}, {MM}, {SEQ} placeholders), default payment terms, default note, bank account selection
    - **Notifications**: email digest frequency (immediate/daily/off), which events to notify
    - **User Profile**: name, email, avatar, password change, personal locale override
  - Each section: form with save button, validation, success/error toast
  - Admin-only sections marked (non-admin sees only User Profile)

  **Must NOT do**:
  - No workflow builder
  - No custom field configuration
  - No theme customization beyond dark/light

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1.4 (with Tasks 14-17)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 4, 9

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:626-636` — AI Configuration (settings pattern example)
  - User requirement: "Vše uživatelsky nastavitelné" — all configurable via UI

  **Acceptance Criteria**:
  - [ ] All settings sections render and save correctly
  - [ ] Work Types CRUD works inline
  - [ ] Invoice number format preview shows example number
  - [ ] Non-admin sees only User Profile section

  **QA Scenarios**:
  ```
  Scenario: Settings page CRUD
    Tool: Playwright
    Steps:
      1. Navigate to /settings with admin
      2. Change locale to English → save → verify UI switches to English
      3. Add new Work Type "Testing" at 900 CZK → verify appears in table
      4. Change invoice number format to "{YYYY}-{SEQ:4}" → verify preview shows "2026-0001"
      5. Log in as member → navigate to /settings → verify only "User Profile" visible
      6. Screenshot
    Expected Result: All settings work, RBAC on sections
    Evidence: .sisyphus/evidence/task-18-settings.png
  ```

  **Commit**: YES
  - Message: `feat(web): settings UI for all configurable items`
  - Files: `apps/web/src/features/settings/**`

### --- Wave 1.5: Phase 1 Completion ---

- [ ] 19. Phase 1 Docker Deployment + Smoke Test

  **What to do**:
  - Update Docker Compose for production build:
    - Multi-stage Dockerfile for API (build + production layers)
    - Nginx serve for Web build
    - Environment variables for all secrets/config
    - Health checks on all containers
    - Volume mounts for PostgreSQL and MinIO data persistence
  - Create `.env.example` with all required environment variables
  - Run full smoke test:
    - `docker compose down -v && docker compose up -d`
    - Wait for all containers healthy
    - Run seed
    - Test auth flow, create project, create tasks, kanban, timer, reports
  - Tag: `v0.1.0-phase1`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1.5 (solo)
  - **Blocks**: Tasks 20-23
  - **Blocked By**: Tasks 11-18

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:994-1007` — Synology deploy structure

  **Acceptance Criteria**:
  - [ ] `docker compose up -d` from clean state → all healthy in 90s
  - [ ] Full user flow works: register → login → create project → create task → kanban → timer → reports
  - [ ] Git tag `v0.1.0-phase1` created

  **QA Scenarios**:
  ```
  Scenario: Clean deployment smoke test
    Tool: Playwright + Bash
    Steps:
      1. docker compose down -v && docker compose up -d
      2. Wait 90s, verify all containers healthy
      3. Playwright: register new user → login → create project "Smoke Test" → create task → drag to "In Progress" → start timer → stop timer → view reports
      4. curl all API endpoints → verify 200/201 responses
    Expected Result: Full app functional from clean state
    Evidence: .sisyphus/evidence/task-19-phase1-smoke.png
  ```

  **Commit**: YES
  - Message: `chore(deploy): Phase 1 production Docker config + smoke test`
  - Pre-commit: `pnpm build && pnpm test`

### === PHASE 2: BILLING ===

### --- Wave 2.1: Schema + Clients ---

- [ ] 20. Prisma Schema Extension — Billing Entities

  **What to do**:
  - Extend `apps/api/prisma/schema.prisma` with Phase 2 models:
    - Client (id UUID, name, ic, dic, isCompany, email, phone, website, billingAddress, deliveryAddress, note, defaultPaymentTermsDays, defaultInvoiceNote, vatSubject bool, country, createdAt, updatedAt, deletedAt)
    - Contact (id, clientId FK, name, email, phone, role, isPrimary)
    - BankAccount (id, name, bankName, accountNumber, iban, swift, currency, isDefault, isActive)
    - Product (id, name, description, unit, defaultUnitPrice decimal, defaultVatPercent decimal, category, isActive)
    - Invoice (id UUID, invoiceNumber string unique, clientId FK, projectId FK nullable, status enum draft/sent/viewed/paid/overdue/cancelled, issueDate, dueDate, taxPointDate, currency, exchangeRate, subtotal, discountPercent, discountAmount, vatPercent, vatAmount, total, totalPaid, bankAccountId FK, paymentMethod enum, qrCodeData, note, footerNote, pdfPath, sentAt, paidAt, timestamps)
    - InvoiceLineItem (id, invoiceId FK, taskId nullable FK, description, quantity decimal, unit, unitPrice decimal, vatPercent decimal, total decimal, sortOrder int)
    - InvoiceNumberSequence (id, prefix, year int, lastNumber int) — for configurable numbering
  - Add relations: Client→Project, Client→Invoice, Invoice→InvoiceLineItem, TimeEntry.invoiceId FK
  - Run `prisma migrate dev --name add-billing`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 21-23)
  - **Blocks**: Tasks 21-27
  - **Blocked By**: Task 19

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:338-451` — Client, Invoice, BankAccount, Product entities

  **Acceptance Criteria**:
  - [ ] Migration creates all tables
  - [ ] Relations resolve correctly

  **QA Scenarios**:
  ```
  Scenario: Billing schema migration
    Tool: Bash
    Steps:
      1. prisma migrate dev --name add-billing → success
      2. psql: SELECT count(*) FROM information_schema.tables WHERE table_name IN ('Client','Invoice','InvoiceLineItem','BankAccount','Product','Contact') → expect 6
    Expected Result: All billing tables created
    Evidence: .sisyphus/evidence/task-20-billing-schema.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add billing entities — Client, Invoice, BankAccount, Product`

- [ ] 21. Clients CRM Module — CRUD, Contacts, Search

  **What to do**:
  - NestJS module `apps/api/src/clients/`:
    - `GET /api/clients` — list with search (name, ic), paginated
    - `POST /api/clients` — create client
    - `GET /api/clients/:id` — get with contacts, projects count, invoices summary
    - `PUT /api/clients/:id` — update
    - `DELETE /api/clients/:id` — soft delete
    - `GET /api/clients/:id/projects` — client's projects
    - `GET /api/clients/:id/invoices` — client's invoices
    - `POST /api/clients/:id/contacts` — add contact person
    - `PUT /api/clients/:id/contacts/:contactId` — update contact
    - `DELETE /api/clients/:id/contacts/:contactId` — remove contact
  - IČO validation (8 digits, checksum validation)
  - ARES API lookup: `GET /api/clients/lookup-ico/:ico` → fetch company data from Czech ARES registry, return prefilled fields

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 20, 22, 23)
  - **Blocks**: Tasks 24, 25
  - **Blocked By**: Task 20

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:338-368` — Client & Contact entities
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:721-730` — Clients API

  **Acceptance Criteria**:
  - [ ] CRUD works with contacts nested
  - [ ] IČO validation rejects invalid numbers
  - [ ] ARES lookup returns company data for valid IČO

  **QA Scenarios**:
  ```
  Scenario: Client CRUD with ARES lookup
    Tool: Bash (curl)
    Steps:
      1. GET /api/clients/lookup-ico/27074358 → expect company name, address from ARES
      2. POST /api/clients with returned data → 201
      3. POST /api/clients/<id>/contacts {"name":"Jan Novák","email":"jan@test.cz","isPrimary":true} → 201
      4. GET /api/clients/<id> → expect contacts array with 1 entry
    Expected Result: ARES integration + client CRUD works
    Evidence: .sisyphus/evidence/task-21-clients.txt
  ```

  **Commit**: YES
  - Message: `feat(clients): CRM module with contacts, IČO validation, ARES lookup`

- [ ] 22. Bank Accounts Module — CRUD

  **What to do**:
  - NestJS module `apps/api/src/bank-accounts/`:
    - `GET /api/bank-accounts` — list
    - `POST /api/bank-accounts` — create (admin only)
    - `PUT /api/bank-accounts/:id` — update
    - `DELETE /api/bank-accounts/:id` — deactivate
    - `PUT /api/bank-accounts/:id/default` — set as default
  - Validate IBAN format (CZ prefix, checksum)
  - Only one default per currency

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 20, 21, 23)
  - **Blocks**: Tasks 25, 28
  - **Blocked By**: Task 20

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:420-432` — BankAccount entity

  **Acceptance Criteria**:
  - [ ] CRUD works, IBAN validated
  - [ ] Only one default per currency enforced

  **QA Scenarios**:
  ```
  Scenario: Bank account management
    Tool: Bash (curl)
    Steps:
      1. POST /api/bank-accounts {"name":"FIO","accountNumber":"2800123456/2010","iban":"CZ6508000000192000145399","currency":"CZK","isDefault":true} → 201
      2. POST second account with isDefault:true → verify first account loses default
    Expected Result: Default account logic works
    Evidence: .sisyphus/evidence/task-22-bank-accounts.txt
  ```

  **Commit**: YES
  - Message: `feat(bank-accounts): CRUD with IBAN validation and default management`

- [ ] 23. Product/Service Catalog — CRUD

  **What to do**:
  - NestJS module `apps/api/src/products/`:
    - `GET /api/products` — list with filter (category, isActive), paginated
    - `POST /api/products` — create
    - `PUT /api/products/:id` — update
    - `DELETE /api/products/:id` — deactivate
  - Categories as free-text with autocomplete (GET /api/products/categories → distinct categories)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.1 (with Tasks 20-22)
  - **Blocks**: Task 25
  - **Blocked By**: Task 20

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:434-451` — Product/Service entity

  **Acceptance Criteria**:
  - [ ] CRUD works, categories autocomplete works

  **QA Scenarios**:
  ```
  Scenario: Product catalog
    Tool: Bash (curl)
    Steps:
      1. POST /api/products {"name":"Webová stránka","unit":"ks","defaultUnitPrice":25000,"category":"Web"} → 201
      2. GET /api/products/categories → expect ["Web"]
      3. GET /api/products?category=Web → expect 1 result
    Expected Result: Catalog with categories
    Evidence: .sisyphus/evidence/task-23-products.txt
  ```

  **Commit**: YES
  - Message: `feat(products): service/product catalog with categories`

### --- Wave 2.2: Invoice Core ---

- [ ] 24. Clients UI — List, Detail, Contacts

  **What to do**:
  - Clients page (`/clients`):
    - List with search, columns: name, IČO, email, projects count, invoices total
    - Click → client detail page
  - Client detail:
    - Header: name, IČO, DIČ, address, contact info
    - Tabs: Projects, Invoices, Contacts, Notes
    - Contacts sub-page: CRUD table
    - "New Client" button → modal with ARES IČO lookup (type IČO → auto-fill fields)
  - Add client selector dropdown to Project create/edit form

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.2 (with Tasks 25-27)
  - **Blocks**: Task 29
  - **Blocked By**: Tasks 9, 21

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:338-368` — Client entity

  **Acceptance Criteria**:
  - [ ] Client list with search works
  - [ ] ARES lookup fills form on IČO input
  - [ ] Contacts CRUD inline on detail page

  **QA Scenarios**:
  ```
  Scenario: Client creation with ARES
    Tool: Playwright
    Steps:
      1. Navigate to /clients → click "New Client"
      2. Enter IČO "27074358" → wait for auto-fill → verify name field populated
      3. Submit → verify client in list
      4. Click client → verify detail page with tabs
    Expected Result: ARES integration + full UI flow
    Evidence: .sisyphus/evidence/task-24-clients-ui.png
  ```

  **Commit**: YES
  - Message: `feat(web): clients CRM UI with ARES lookup, contacts management`

- [ ] 25. Invoice Module — CRUD + Line Items + Configurable Numbering

  **What to do**:
  - NestJS module `apps/api/src/invoices/`:
    - `GET /api/invoices` — list with filters (status, clientId, dateRange), paginated
    - `POST /api/invoices` — create (auto-generates number from settings format)
    - `GET /api/invoices/:id` — get with line items
    - `PUT /api/invoices/:id` — update (only draft status)
    - `DELETE /api/invoices/:id` — delete (only draft)
    - `POST /api/invoices/:id/send` — change status to sent, set sentAt
    - `POST /api/invoices/:id/paid` — mark as paid, set paidAt, totalPaid
    - `POST /api/invoices/:id/cancel` — cancel invoice
  - Invoice line items:
    - CRUD nested within invoice
    - Auto-compute: lineTotal = quantity × unitPrice, subtotal = sum(lineTotals), vatAmount = subtotal × vatPercent / 100, total = subtotal + vatAmount - discountAmount
    - Can add from product catalog (prefill description, unit, price)
  - Invoice numbering:
    - Format from settings: e.g. "{YYYY}-{SEQ:3}" → "2026-001"
    - Year-based sequence reset
    - Sequence stored in InvoiceNumberSequence table
    - Thread-safe: use SELECT FOR UPDATE to avoid duplicates
  - Status transitions: draft→sent→paid, draft→cancelled, sent→paid, sent→overdue (cron job)

  **Must NOT do**:
  - No recurring invoices
  - No multi-currency conversion (store in single currency)
  - No credit notes

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.2 (with Tasks 24, 26, 27)
  - **Blocks**: Tasks 26, 28, 29
  - **Blocked By**: Tasks 20-23

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:374-417` — Invoice & InvoiceLineItem entities
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:733-745` — Invoices API
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:453-475` — Czech compliance requirements

  **Acceptance Criteria**:
  - [ ] Invoice CRUD with auto-numbering
  - [ ] Line items compute correctly (totals, VAT)
  - [ ] Status transitions enforced (can't edit sent invoice)
  - [ ] Number sequence is thread-safe (no duplicates)

  **QA Scenarios**:
  ```
  Scenario: Invoice creation and lifecycle
    Tool: Bash (curl)
    Steps:
      1. POST /api/invoices {"clientId":"<id>","dueDate":"2026-05-04"} → 201, expect invoiceNumber "2026-001"
      2. POST /api/invoices/<id>/line-items {"description":"Programování","quantity":5,"unit":"hod","unitPrice":1500,"vatPercent":0} → 201
      3. GET /api/invoices/<id> → verify subtotal=7500, total=7500
      4. POST /api/invoices/<id>/send → 200, status="sent"
      5. PUT /api/invoices/<id> {"note":"test"} → 400 (can't edit sent invoice)
      6. POST /api/invoices/<id>/paid {"totalPaid":7500} → 200, status="paid"
      7. POST second invoice → expect number "2026-002"
    Expected Result: Full lifecycle with number sequence
    Evidence: .sisyphus/evidence/task-25-invoices.txt
  ```

  **Commit**: YES
  - Message: `feat(invoices): CRUD with line items, configurable numbering, status transitions`

- [ ] 26. Invoice from Time Entries — Select Entries → Generate Lines

  **What to do**:
  - API endpoint `POST /api/invoices/from-entries`:
    - Params: projectId, dateFrom, dateTo, workTypeIds[] (optional filter)
    - Fetches unbilled time entries matching criteria
    - Groups by work type
    - Creates invoice with line items: one per work type group
    - Line item: description = work type name, quantity = total hours, unitPrice = work type rate, unit = "hod"
    - Marks time entries as invoiced (sets invoiceId FK)
  - Also: `GET /api/invoices/preview-from-entries` — same logic but returns preview without creating

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.2 (with Tasks 24, 25, 27)
  - **Blocks**: Task 29
  - **Blocked By**: Tasks 13, 25

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:415-418` — "InvoiceLineItem může vzniknout z time entries"
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1063-1069` — Invoice Generation Flow

  **Acceptance Criteria**:
  - [ ] Preview returns correct grouping without creating
  - [ ] Create generates invoice with correct line items
  - [ ] Time entries marked as invoiced after creation
  - [ ] Already-invoiced entries excluded from selection

  **QA Scenarios**:
  ```
  Scenario: Invoice from time entries
    Tool: Bash (curl)
    Preconditions: Project with 3 time entries (2 Programování, 1 Administrativa)
    Steps:
      1. GET /api/invoices/preview-from-entries?projectId=<id>&dateFrom=2026-04-01&dateTo=2026-04-30 → expect 2 line items grouped by work type
      2. POST /api/invoices/from-entries same params → 201, invoice with 2 line items
      3. GET /api/time-entries?projectId=<id>&isBillable=true → all 3 now have invoiceId set
      4. POST /api/invoices/from-entries same params again → 201 but 0 line items (all already invoiced)
    Expected Result: Entries grouped, invoiced, and excluded from future
    Evidence: .sisyphus/evidence/task-26-invoice-from-entries.txt
  ```

  **Commit**: YES
  - Message: `feat(invoices): generate invoice from unbilled time entries`

- [ ] 27. SPAYD QR Code Generation

  **What to do**:
  - Utility module `apps/api/src/invoices/spayd/`:
    - `generateSpayd(params: SpaydParams): string` — generates SPAYD string per Czech spec
    - `generateQrCode(spaydString: string): Buffer` — generates QR code PNG (300x300, error correction M)
  - SpaydParams: iban, amount, currency, variableSymbol, dueDate, message
  - Use `qrcode` npm package for QR generation
  - Auto-called when invoice is created/updated: compute qrCodeData field
  - API: `GET /api/invoices/:id/qr` → returns QR code as PNG image

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.2 (with Tasks 24-26)
  - **Blocks**: Task 28
  - **Blocked By**: Task 22

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:472-481` — SPAYD format
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1195-1228` — SPAYD specification

  **Acceptance Criteria**:
  - [ ] SPAYD string matches spec format
  - [ ] QR code decodes back to valid SPAYD string
  - [ ] GET /api/invoices/:id/qr returns PNG

  **QA Scenarios**:
  ```
  Scenario: SPAYD QR generation and validation
    Tool: Bash
    Steps:
      1. Create invoice with known bank account and amount
      2. GET /api/invoices/<id>/qr → save as PNG
      3. Decode QR code (zbarimg or similar) → verify starts with "SPD*1.0*"
      4. Verify SPAYD contains correct ACC (IBAN), AM (amount), CC (CZK)
    Expected Result: Valid SPAYD QR code generated
    Evidence: .sisyphus/evidence/task-27-spayd-qr.png
  ```

  **Commit**: YES
  - Message: `feat(invoices): SPAYD QR code generation per Czech spec`

### --- Wave 2.3: Invoice Output + Delivery ---

- [ ] 28. Invoice PDF Generation — PDFKit, Czech Compliant Layout

  **What to do**:
  - PDF generator in `apps/api/src/invoices/pdf/`:
    - Use PDFKit (lightweight, no Chromium dependency)
    - A4 layout matching spec: logo area, supplier/client info, dates, line items table, totals, QR code, payment info
    - Czech text: proper UTF-8 encoding, Czech date format (DD.MM.YYYY)
    - Include all §29 DPH required fields (even for non-VAT payer: IČO, dates, amounts)
    - Embed SPAYD QR code as PNG image
    - Store generated PDF in MinIO, save path to invoice.pdfPath
  - API: `POST /api/invoices/:id/pdf` — generate/regenerate PDF
  - API: `GET /api/invoices/:id/pdf` — download PDF (stream from MinIO)
  - Auto-generate on status change to "sent"

  **Must NOT do**:
  - No template customization (single professional template)
  - No WYSIWYG PDF editor

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.3 (with Tasks 29-31)
  - **Blocks**: Tasks 29, 32
  - **Blocked By**: Tasks 25, 27

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:484-514` — Invoice PDF layout
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:455-470` — Czech compliance checklist
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1177-1194` — Legal requirements

  **Acceptance Criteria**:
  - [ ] PDF generated with correct layout
  - [ ] All §29 fields present (IČO, dates, amounts, descriptions)
  - [ ] QR code embedded in PDF
  - [ ] PDF downloadable from API
  - [ ] Czech characters render correctly

  **QA Scenarios**:
  ```
  Scenario: PDF generation with Czech compliance
    Tool: Bash
    Steps:
      1. POST /api/invoices/<id>/pdf → 200
      2. GET /api/invoices/<id>/pdf → save as test-invoice.pdf
      3. Extract text from PDF (pdftotext) → verify contains: IČO, date in DD.MM.YYYY format, line items, total amount
      4. Verify file size > 10KB (not empty/corrupt)
    Expected Result: Valid PDF with all required fields
    Evidence: .sisyphus/evidence/task-28-invoice-pdf.pdf
  ```

  **Commit**: YES
  - Message: `feat(invoices): PDF generation with PDFKit, Czech compliance, QR code`

- [ ] 29. Invoice UI — List, Create/Edit, Preview, Status Management

  **What to do**:
  - Invoices page (`/invoices`):
    - List: columns (number, client, status badge, issue date, due date, total, paid)
    - Filters: status, client, date range
    - Status badges: color-coded (draft=gray, sent=blue, paid=green, overdue=red, cancelled=strikethrough)
  - Invoice create/edit page:
    - Client selector (dropdown with search)
    - Date fields: issue date, due date, tax point date
    - Line items table: add from catalog, add from time entries, add manual row
    - "Add from time entries" button → modal with project/date/workType selectors → preview grouped entries → confirm
    - Auto-compute totals as items are added/edited
    - Discount field (% or absolute)
    - Notes field
    - Bank account selector
  - Invoice detail page:
    - Full invoice view (similar to PDF layout)
    - Actions: Edit (if draft), Send, Mark as Paid, Cancel, Download PDF, Regenerate PDF
    - PDF preview (embedded PDF viewer or iframe)
  - Invoice action buttons with confirmation dialogs

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.3 (with Tasks 28, 30, 31)
  - **Blocks**: Task 32
  - **Blocked By**: Tasks 24-26, 28

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1063-1069` — Invoice Generation Flow

  **Acceptance Criteria**:
  - [ ] Invoice list with filters and status badges
  - [ ] Create invoice from scratch and from time entries
  - [ ] PDF preview works inline
  - [ ] Status transitions via action buttons

  **QA Scenarios**:
  ```
  Scenario: Invoice creation from time entries
    Tool: Playwright
    Steps:
      1. Navigate to /invoices → "New Invoice"
      2. Select client from dropdown
      3. Click "Add from time entries" → select project, date range → preview → confirm
      4. Verify line items populated with work type groups
      5. Verify total auto-computed
      6. Click "Save" → verify redirect to invoice detail
      7. Click "Download PDF" → verify PDF downloads
      8. Screenshot
    Expected Result: Full invoice creation flow works
    Evidence: .sisyphus/evidence/task-29-invoice-ui.png
  ```

  **Commit**: YES
  - Message: `feat(web): invoice UI with create from entries, PDF preview, status management`

- [ ] 30. Email Sending Module — SMTP, Invoice Delivery, Notifications

  **What to do**:
  - NestJS module `apps/api/src/email/`:
    - Nodemailer with SMTP transport (configurable via settings)
    - `POST /api/invoices/:id/send` enhanced: sends email with PDF attachment to client's email
    - Email templates (Handlebars): invoice delivery, payment reminder, notification digest
    - Queue via BullMQ: email jobs queued, processed by worker
    - Settings: SMTP host/port/user/pass, from name, from email
    - Retry: 3 attempts with exponential backoff
  - Email templates in `apps/api/src/email/templates/`:
    - `invoice-sent.hbs` — "Dobrý den, zasíláme fakturu č. {number}..."
    - `payment-reminder.hbs` — "Připomínáme neuhrazenou fakturu..."
    - `notification-digest.hbs` — daily summary of activities

  **Must NOT do**:
  - No HTML email builder UI
  - No tracking pixels

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.3 (with Tasks 28, 29, 31)
  - **Blocks**: Task 32
  - **Blocked By**: Task 4

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:843-848` — Notification types (email)
  - User has WEDOS SMTP available

  **Acceptance Criteria**:
  - [ ] SMTP sends email successfully
  - [ ] Invoice email has PDF attachment
  - [ ] Queue processes jobs with retries
  - [ ] Templates render Czech text correctly

  **QA Scenarios**:
  ```
  Scenario: Invoice email delivery
    Tool: Bash
    Steps:
      1. Configure SMTP settings via API (use Mailhog for testing)
      2. POST /api/invoices/<id>/send → 200
      3. Check Mailhog inbox → verify email received with PDF attachment
      4. Verify subject contains invoice number
    Expected Result: Email sent with PDF attachment
    Evidence: .sisyphus/evidence/task-30-email.txt
  ```

  **Commit**: YES
  - Message: `feat(email): SMTP email module with invoice delivery and templates`

- [ ] 31. iCal Export — Task Deadlines as Calendar Events

  **What to do**:
  - API endpoint `GET /api/calendar/ical` — returns .ics file with:
    - All tasks with due_date as VEVENT (summary = task name, dtstart = due date, description = task description + project name)
    - Include project start/end dates as all-day events
  - Per-user iCal URL with auth token in query string (e.g., `/api/calendar/ical?token=<personal-token>`)
  - Generate personal calendar token per user (stored in user settings)
  - iCal format: RFC 5545 compliant, use `ical-generator` npm package

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2.3 (with Tasks 28-30)
  - **Blocks**: Task 32
  - **Blocked By**: Task 10

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:876-879` — iCal export

  **Acceptance Criteria**:
  - [ ] .ics file is valid RFC 5545
  - [ ] Tasks with due dates appear as events
  - [ ] Token-based auth works (no login required for calendar subscription)

  **QA Scenarios**:
  ```
  Scenario: iCal export
    Tool: Bash
    Steps:
      1. GET /api/users/me/calendar-token → get token
      2. curl /api/calendar/ical?token=<token> → save as cal.ics
      3. Verify file starts with "BEGIN:VCALENDAR"
      4. Verify contains VEVENT entries matching tasks with due dates
    Expected Result: Valid iCal file with task events
    Evidence: .sisyphus/evidence/task-31-ical.txt
  ```

  **Commit**: YES
  - Message: `feat(calendar): iCal export for task deadlines`

### --- Wave 2.4: Phase 2 Completion ---

- [ ] 32. Phase 2 Docker Deployment + Invoice Smoke Test

  **What to do**:
  - Update Docker Compose with Mailhog for dev (optional email testing container)
  - Add BullMQ worker service to Docker Compose
  - Full smoke test: create client → create project → track time → create invoice from entries → generate PDF → send email → mark paid
  - Verify all Phase 1 features still work
  - Tag: `v0.2.0-phase2`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2.4 (solo)
  - **Blocks**: Tasks 33-35
  - **Blocked By**: Tasks 28-31

  **Acceptance Criteria**:
  - [ ] Full billing workflow works end-to-end
  - [ ] Phase 1 features still functional (regression)
  - [ ] Tag v0.2.0-phase2 created

  **QA Scenarios**:
  ```
  Scenario: Full billing workflow
    Tool: Playwright
    Steps:
      1. Create client with ARES → create project → assign client → create tasks → track time
      2. Create invoice from time entries → verify line items → download PDF → verify PDF content
      3. Send invoice email → verify email received (Mailhog)
      4. Mark as paid → verify status
    Expected Result: Complete billing workflow
    Evidence: .sisyphus/evidence/task-32-phase2-smoke.png
  ```

  **Commit**: YES
  - Message: `chore(deploy): Phase 2 billing deployment + smoke test`

### === PHASE 3: VIEWS EXPANSION ===

### --- Wave 3.1: Calendar + Gantt + Dashboard ---

- [ ] 33. Calendar View — Deadline Calendar, Time Entry Blocks

  **What to do**:
  - React component `apps/web/src/features/calendar/CalendarView.tsx`:
    - Month/week/day views using a calendar library (e.g., `@schedule-x/react` or custom with `date-fns`)
    - Task deadlines: displayed as colored dots/chips on due dates, color = project color
    - Time entry blocks (week/day view only): horizontal blocks showing worked hours, color = work type
    - Click on date → quick-create task with that due date
    - Click on task chip → task detail side panel
    - Navigation: prev/next month/week, today button
    - Color coding legend
  - Data sources: `/api/projects/:id/tasks` (for deadline view), `/api/time-entries` (for time blocks)

  **Must NOT do**:
  - No drag-to-create time entries on calendar
  - No recurring events
  - No external calendar overlay

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 34, 35)
  - **Blocks**: Task 39
  - **Blocked By**: Tasks 9, 10, 13

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:246-251` — Calendar View spec
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:868-874` — Calendar views detail

  **Acceptance Criteria**:
  - [ ] Month/week/day views render correctly
  - [ ] Task deadlines shown on correct dates
  - [ ] Time entries shown as blocks in week/day view
  - [ ] Click date creates task with that due date

  **QA Scenarios**:
  ```
  Scenario: Calendar with tasks and time entries
    Tool: Playwright
    Preconditions: Tasks with due dates, time entries for current week
    Steps:
      1. Navigate to calendar view
      2. Verify task deadline chips on correct dates
      3. Switch to week view → verify time entry blocks visible
      4. Click on a date → verify task creation modal opens with date pre-filled
      5. Screenshot month and week views
    Expected Result: Both views render with correct data
    Evidence: .sisyphus/evidence/task-33-calendar.png
  ```

  **Commit**: YES
  - Message: `feat(web): calendar view with deadline dots and time entry blocks`
  - Files: `apps/web/src/features/calendar/**`

- [ ] 34. Gantt Chart — Dependencies, Milestones, Zoom

  **What to do**:
  - React component `apps/web/src/features/tasks/views/GanttView.tsx`:
    - Use a Gantt library (e.g., `gantt-task-react` or custom SVG-based)
    - Horizontal bars: task start_date → due_date (or estimated duration)
    - Dependency arrows between tasks (from TaskDependency data)
    - Milestones: tasks with no duration, shown as diamond/marker
    - Zoom levels: day, week, month, quarter (toggle buttons)
    - Left panel: task list (name, assignee, dates) — collapsible with subtask hierarchy
    - Right panel: timeline bars
    - Color: by project or by status
    - Progress indicator on bars (% complete based on subtask completion)
    - Today line (vertical red line on current date)
  - Data: fetch tasks with dependencies from API, compute layout client-side

  **Must NOT do**:
  - No drag-to-resize bars (read-only Gantt for now)
  - No critical path highlighting
  - No export to PNG/PDF

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 33, 35)
  - **Blocks**: Task 39
  - **Blocked By**: Tasks 9, 10

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:252-258` — Gantt Chart spec

  **Acceptance Criteria**:
  - [ ] Bars render for tasks with start/due dates
  - [ ] Dependency arrows connect related tasks
  - [ ] Zoom levels change timeline granularity
  - [ ] Subtask hierarchy collapsible in left panel

  **QA Scenarios**:
  ```
  Scenario: Gantt chart with dependencies
    Tool: Playwright
    Preconditions: Project with tasks, subtasks, and dependencies
    Steps:
      1. Navigate to project → Gantt view
      2. Verify task bars on timeline
      3. Verify dependency arrows between connected tasks
      4. Toggle zoom to "Month" → verify bars resize
      5. Collapse subtask group → verify children hidden
      6. Verify today line visible
      7. Screenshot
    Expected Result: Gantt renders with all features
    Evidence: .sisyphus/evidence/task-34-gantt.png
  ```

  **Commit**: YES
  - Message: `feat(web): Gantt chart with dependencies, milestones, zoom`
  - Files: `apps/web/src/features/tasks/views/GanttView.tsx`

- [ ] 35. Dashboard Page — Fixed Widgets

  **What to do**:
  - Dashboard page (`/`) with fixed layout (CSS grid, 2-3 columns):
    - **My Tasks Today**: list of tasks assigned to me with due date today or overdue, with status toggle
    - **Running Timer**: current timer (if any) with stop button, or "No timer running" with quick-start
    - **Overdue Tasks**: count + list of overdue tasks across all projects
    - **Weekly Hours**: bar chart of hours logged per day this week (Recharts)
    - **Project Budget Status**: list of active projects with budget progress bars (budget vs actual)
    - **Upcoming Deadlines**: tasks due in next 7 days, sorted by date
    - ~~Recent Activity~~ — **DEFERRED to Task 52** (activity log not yet available)
    - ~~Unread Notifications~~ — **DEFERRED to Task 38** (notification system not yet available)
  - Placeholder cards for deferred widgets: "Coming soon — Activity Log" / "Coming soon — Notifications"
  - All data from existing API endpoints (Tasks 6-16), fetched in parallel
  - Skeleton loading states for each widget

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.1 (with Tasks 33, 34)
  - **Blocks**: Task 39
  - **Blocked By**: Tasks 9, 15, 16

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1049-1053` — Morning Standup Flow

  **Acceptance Criteria**:
  - [ ] 6 data widgets render with data + 2 placeholder cards for deferred widgets
  - [ ] Timer widget shows live timer or quick-start
  - [ ] Weekly hours chart shows correct data
  - [ ] Skeleton loading on initial fetch

  **QA Scenarios**:
  ```
  Scenario: Dashboard with populated widgets
    Tool: Playwright
    Preconditions: Tasks, time entries, running projects exist
    Steps:
      1. Navigate to /
      2. Verify "My Tasks Today" shows relevant tasks
      3. Verify "Weekly Hours" chart renders with bars
      4. Verify "Project Budget Status" shows progress bars
      5. Start timer from dashboard → verify Running Timer widget updates
      6. Screenshot
    Expected Result: All widgets functional
    Evidence: .sisyphus/evidence/task-35-dashboard.png
  ```

  **Commit**: YES
  - Message: `feat(web): dashboard with 6 data widgets + 2 deferred placeholders`
  - Files: `apps/web/src/features/dashboard/**`

### --- Wave 3.2: Advanced Features ---

- [ ] 36. Advanced Filters + Saved Views

  **What to do**:
  - Filter builder component (reusable across all list/kanban views):
    - Add filter conditions: field (status, assignee, priority, due date, tags, work type) + operator (is, is not, contains, before, after, between) + value
    - Multiple conditions with AND/OR logic
    - Quick filter presets: "My Tasks", "Overdue", "Due This Week", "Unassigned"
  - Saved views:
    - Save current filters + sort + group + view type (kanban/list/calendar/gantt) as named preset
    - Per-user saved views stored in DB: `UserView` table (userId, name, entityType, config JSON)
    - API: `GET /api/views`, `POST /api/views`, `PUT /api/views/:id`, `DELETE /api/views/:id`
    - Quick switch dropdown in view header
  - URL sync: filters reflected in URL query params (shareable links)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Tasks 37, 38)
  - **Blocks**: Task 39
  - **Blocked By**: Tasks 9, 10

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:265-267` — Saved view presets, quick switching

  **Acceptance Criteria**:
  - [ ] Filter builder adds/removes conditions
  - [ ] Saved views persist and restore correctly
  - [ ] URL reflects current filters
  - [ ] Presets work (My Tasks, Overdue, etc.)

  **QA Scenarios**:
  ```
  Scenario: Save and restore view
    Tool: Playwright
    Steps:
      1. Navigate to project tasks → add filter "status is In Progress" + "assignee is me"
      2. Click "Save View" → name it "My Active Tasks"
      3. Clear filters → verify all tasks shown
      4. Select saved view "My Active Tasks" from dropdown → verify filters restored
      5. Copy URL → open in new tab → verify same filtered view
    Expected Result: Views save, restore, and sync to URL
    Evidence: .sisyphus/evidence/task-36-saved-views.png
  ```

  **Commit**: YES
  - Message: `feat(web): advanced filter builder and saved views`

- [ ] 37. Global Search — Full-text Across Entities

  **What to do**:
  - Backend: PostgreSQL full-text search (tsvector/tsquery):
    - `GET /api/search?q=<query>` — search across: projects (name, description), tasks (name, description), clients (name, ic), invoices (number, note)
    - Returns grouped results: { projects: [], tasks: [], clients: [], invoices: [] }
    - Ranked by relevance (ts_rank)
    - Highlight matching text (ts_headline)
  - Frontend: Cmd+K search overlay (already scaffolded in Task 9):
    - Type-ahead with debounce (300ms)
    - Results grouped by entity type with icons
    - Arrow keys to navigate results, Enter to open
    - Recent searches stored in localStorage
    - Empty state: show recent items

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Tasks 36, 38)
  - **Blocks**: Task 39
  - **Blocked By**: Tasks 2, 9

  **References**:
  - No direct spec reference, but Cmd+K search is core to Linear-style UX

  **Acceptance Criteria**:
  - [ ] Search returns results across all entity types
  - [ ] Relevance ranking works (exact match ranked higher)
  - [ ] Cmd+K overlay with type-ahead works
  - [ ] Enter opens selected result

  **QA Scenarios**:
  ```
  Scenario: Global search
    Tool: Playwright
    Steps:
      1. Press Cmd+K → search overlay opens
      2. Type "test" → verify results appear grouped (projects, tasks, etc.)
      3. Arrow down to select a task result → press Enter → verify navigated to task
      4. Press Cmd+K again → verify "test" in recent searches
    Expected Result: Search works across entities with keyboard nav
    Evidence: .sisyphus/evidence/task-37-search.png
  ```

  **Commit**: YES
  - Message: `feat: global full-text search with Cmd+K overlay`

- [ ] 38. Notification System — In-App + Email Digest

  **What to do**:
  - Backend `apps/api/src/notifications/`:
    - Notification model: id, userId, type enum, title, body, entityType, entityId, isRead, createdAt
    - Create notifications on triggers:
      - Task assigned to you
      - Task due date approaching (24h before — cron job)
      - Task overdue (cron job)
      - Invoice paid
      - Project budget 80% consumed
    - API: `GET /api/notifications` (list, filter: isRead), `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
    - SSE endpoint: `GET /api/notifications/stream` — Server-Sent Events for live updates
    - Email digest: daily cron job collects unread notifications → sends digest email (uses email module)
    - User notification preferences stored in user settings (per-trigger: in-app/email/off)
  - Frontend:
    - Notification bell in top bar with unread count badge
    - Click → dropdown panel with notification list
    - Click notification → navigate to related entity
    - Mark as read on click, "Mark all read" button
    - SSE connection for live updates (increment badge count)

  **Must NOT do**:
  - No Telegram integration (Phase 5)
  - No push notifications
  - No notification sound

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3.2 (with Tasks 36, 37)
  - **Blocks**: Task 39
  - **Blocked By**: Tasks 4, 30

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:841-865` — Notifications & Activity module

  **Acceptance Criteria**:
  - [ ] Notifications created on all defined triggers
  - [ ] SSE delivers live notifications to frontend
  - [ ] Bell shows correct unread count
  - [ ] Email digest sends daily summary

  **QA Scenarios**:
  ```
  Scenario: Live notification flow
    Tool: Playwright + Bash
    Steps:
      1. Open app in browser (user A logged in)
      2. Via curl: assign a task to user A → POST /api/tasks/<id> {"assigneeId":"<userA-id>"}
      3. Verify notification bell count increments (SSE)
      4. Click bell → verify notification "Task assigned to you" appears
      5. Click notification → verify navigated to task
      6. Verify notification marked as read, count decrements
    Expected Result: Live notifications work end-to-end
    Evidence: .sisyphus/evidence/task-38-notifications.png
  ```

  **Commit**: YES
  - Message: `feat(notifications): in-app + email digest with SSE live updates`

### --- Wave 3.3: Phase 3 Completion ---

- [ ] 39. Phase 3 Docker Deployment + Views Smoke Test

  **What to do**:
  - Full smoke test of all views: Kanban, List, Calendar, Gantt, Dashboard
  - Test saved views, global search, notifications
  - Verify all Phase 1 + Phase 2 features still work
  - Performance check: page loads < 2s, kanban drag < 100ms
  - Tag: `v0.3.0-phase3`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 40-41
  - **Blocked By**: Tasks 33-38

  **Acceptance Criteria**:
  - [ ] All views render correctly with real data
  - [ ] Performance targets met
  - [ ] No Phase 1/2 regressions

  **QA Scenarios**:
  ```
  Scenario: All views smoke test
    Tool: Playwright
    Steps:
      1. Navigate through all views: Dashboard, Kanban, List, Calendar, Gantt, Reports
      2. Measure page load times → all < 2s
      3. Kanban drag-drop → measure response < 100ms
      4. Search via Cmd+K → verify results
      5. Check notification bell → verify live update
    Expected Result: All features functional, performance OK
    Evidence: .sisyphus/evidence/task-39-phase3-smoke.png
  ```

  **Commit**: YES
  - Message: `chore(deploy): Phase 3 views deployment + smoke test`

### === PHASE 4: AI INTEGRATION ===

### --- Wave 4.1: AI Engine ---

- [ ] 40. AI Engine Module — Multi-Provider Support

  **What to do**:
  - NestJS module `apps/api/src/ai/`:
    - Abstract `AIProvider` interface: `generateText(prompt, options): Promise<AIResponse>`
    - Providers: OpenAI, Google Gemini, OpenRouter
    - Each provider: API key from settings, model selection, temperature, max_tokens
    - Provider registry: register providers at startup, select per-request based on user preference
    - Fallback chain: if primary provider fails → try secondary
    - Token usage tracking: log tokens per request, enforce monthly budget limit per user
    - Rate limiting: per-provider, per-user
    - Caching: cache identical prompts for 1h (Redis)
    - API: `GET /api/ai/models` — list available models across providers
    - API: `GET /api/ai/usage` — current user's token usage for this month
  - Skills framework:
    - `AISkill` base class: name, description, systemPrompt, userPromptTemplate, outputSchema (Zod)
    - Skills registered in module, discoverable via API
    - `POST /api/ai/run-skill` — { skillName, input } → runs skill with appropriate provider

  **Must NOT do**:
  - No streaming (simple request-response for now)
  - No fine-tuning or embeddings
  - No conversation history / memory

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.1 (with Task 41)
  - **Blocks**: Tasks 42-48
  - **Blocked By**: Task 4

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:555-587` — AI Engine architecture
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:625-636` — AI Configuration

  **Acceptance Criteria**:
  - [ ] OpenAI provider generates text with correct API call
  - [ ] Fallback works: disable primary → secondary responds
  - [ ] Token usage tracked per user
  - [ ] Budget limit enforced (returns 429 when exceeded)
  - [ ] Skills framework: skill registers and runs

  **QA Scenarios**:
  ```
  Scenario: AI provider with fallback
    Tool: Bash (curl)
    Steps:
      1. Configure OpenAI API key via settings
      2. POST /api/ai/run-skill {"skillName":"test-echo","input":"Hello"} → expect AI response
      3. GET /api/ai/usage → expect tokenCount > 0
      4. GET /api/ai/models → expect list of models from configured providers
      5. Set invalid API key → POST /api/ai/run-skill → expect fallback to secondary provider (or error if none)
    Expected Result: Provider works with usage tracking and fallback
    Evidence: .sisyphus/evidence/task-40-ai-engine.txt
  ```

  **Commit**: YES
  - Message: `feat(ai): multi-provider AI engine with skills framework, fallback, usage tracking`

- [ ] 41. AI Config UI — Provider Settings, API Keys, Model Selection

  **What to do**:
  - Settings page extension (`/settings/ai`):
    - AI Providers section: cards for each provider (OpenAI, Gemini, OpenRouter)
      - Enable/disable toggle
      - API key input (masked)
      - Default model selector (dropdown populated from provider's model list)
      - Test connection button → makes test call, shows success/error
    - Default preferences: preferred provider, quality vs speed toggle, temperature slider
    - Budget: monthly token limit input, current usage progress bar
    - Skills overview: list of available skills with descriptions

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.1 (with Task 40)
  - **Blocks**: Tasks 42-48
  - **Blocked By**: Tasks 9, 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:625-636` — AI Configuration settings

  **Acceptance Criteria**:
  - [ ] Provider cards render with enable/disable
  - [ ] API key saves (masked display)
  - [ ] Test connection shows success/error
  - [ ] Budget usage displayed correctly

  **QA Scenarios**:
  ```
  Scenario: AI settings configuration
    Tool: Playwright
    Steps:
      1. Navigate to /settings/ai
      2. Enable OpenAI provider → enter API key → click "Test Connection" → verify success message
      3. Set monthly budget to 100000 tokens → verify progress bar shows 0%
      4. Select default model from dropdown → save → refresh → verify persisted
    Expected Result: AI config saves and tests correctly
    Evidence: .sisyphus/evidence/task-41-ai-config.png
  ```

  **Commit**: YES
  - Message: `feat(web): AI settings UI with provider config, API key management`

### --- Wave 4.2: AI Skills ---

- [ ] 42. AI Skill: Task Decomposition

  **What to do**:
  - Skill in `apps/api/src/ai/skills/task-decomposition.skill.ts`:
    - Input: task (name, description, estimatedHours)
    - System prompt: "You are a project manager. Decompose this task into 3-7 concrete subtasks with hour estimates."
    - Output schema (Zod): array of { name: string, description: string, estimatedHours: number }
    - Output validation: total subtask hours should not exceed 2x parent estimate
  - API: `POST /api/ai/decompose-task` — { taskId } → returns suggested subtasks
  - Optional: auto-create subtasks on user confirmation (separate endpoint)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Tasks 43-46)
  - **Blocks**: Tasks 48, 49
  - **Blocked By**: Tasks 10, 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:591-598` — Task Decomposition skill spec

  **Acceptance Criteria**:
  - [ ] Returns 3-7 subtasks with estimates
  - [ ] Output validates against Zod schema
  - [ ] Works with real AI provider (OpenAI or OpenRouter)

  **QA Scenarios**:
  ```
  Scenario: Decompose a task
    Tool: Bash (curl)
    Preconditions: AI provider configured with valid API key
    Steps:
      1. Create task "Implement user authentication" with estimatedHours=20
      2. POST /api/ai/decompose-task {"taskId":"<id>"} → expect array of 3-7 subtasks
      3. Verify each subtask has name, description, estimatedHours
      4. Verify total hours reasonable (not > 40)
    Expected Result: AI returns structured subtask suggestions
    Evidence: .sisyphus/evidence/task-42-ai-decompose.txt
  ```

  **Commit**: YES
  - Message: `feat(ai): task decomposition skill`

- [ ] 43. AI Skill: Meeting Notes → Tasks

  **What to do**:
  - Skill in `apps/api/src/ai/skills/meeting-to-tasks.skill.ts`:
    - Input: freeform text (meeting notes)
    - System prompt: "Extract action items from meeting notes. For each: task name, description, suggested assignee (if mentioned), deadline (if mentioned), priority."
    - Output schema: array of { name, description, suggestedAssignee?, deadline?, priority }
  - API: `POST /api/ai/meeting-to-tasks` — { text, projectId } → returns suggested tasks
  - Bulk create endpoint: `POST /api/ai/meeting-to-tasks/apply` — { suggestions[], projectId } → creates tasks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Tasks 42, 44-46)
  - **Blocks**: Tasks 48, 49
  - **Blocked By**: Tasks 10, 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:600-605` — Meeting Notes skill spec

  **Acceptance Criteria**:
  - [ ] Extracts tasks from unstructured meeting notes
  - [ ] Output validates against schema
  - [ ] Apply endpoint creates actual tasks

  **QA Scenarios**:
  ```
  Scenario: Meeting notes extraction
    Tool: Bash (curl)
    Steps:
      1. POST /api/ai/meeting-to-tasks {"text":"Discussed login page. Jan will implement OAuth by Friday. Maria needs to review the design. We need to add password reset flow - high priority.","projectId":"<id>"}
      2. Expect 3 tasks: OAuth (Jan, Friday), design review (Maria), password reset (high priority)
      3. POST /api/ai/meeting-to-tasks/apply with returned suggestions → verify tasks created in project
    Expected Result: AI extracts and creates tasks from notes
    Evidence: .sisyphus/evidence/task-43-meeting-notes.txt
  ```

  **Commit**: YES
  - Message: `feat(ai): meeting notes to tasks skill`

- [ ] 44. AI Skill: Invoice Draft Generation

  **What to do**:
  - Skill in `apps/api/src/ai/skills/invoice-draft.skill.ts`:
    - Input: projectId, dateRange, context (optional description)
    - Fetches unbilled time entries + project info
    - AI suggests: grouped line items with better descriptions (not just work type names), suggested notes, suggested due date
    - Output: draft invoice structure ready for review

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Tasks 42, 43, 45, 46)
  - **Blocks**: Task 49
  - **Blocked By**: Tasks 25, 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:607-610` — Invoice Draft skill spec

  **Acceptance Criteria**:
  - [ ] Returns structured invoice draft from time entries
  - [ ] Descriptions more readable than raw work type names

  **QA Scenarios**:
  ```
  Scenario: AI invoice draft
    Tool: Bash (curl)
    Steps:
      1. POST /api/ai/invoice-draft {"projectId":"<id>","dateFrom":"2026-04-01","dateTo":"2026-04-30"}
      2. Expect structured line items with AI-enhanced descriptions
    Expected Result: Draft invoice with better descriptions
    Evidence: .sisyphus/evidence/task-44-ai-invoice.txt
  ```

  **Commit**: YES
  - Message: `feat(ai): invoice draft generation skill`

- [ ] 45. AI Skill: Weekly Review Summary

  **What to do**:
  - Skill in `apps/api/src/ai/skills/weekly-review.skill.ts`:
    - Input: userId, dateRange (default: last 7 days)
    - Fetches: time entries, completed tasks, new tasks, project status changes
    - AI generates: textual summary suitable for client/management reporting
    - Output: markdown-formatted summary
  - API: `POST /api/ai/weekly-review` → returns summary text

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Tasks 42-44, 46)
  - **Blocks**: Task 49
  - **Blocked By**: Tasks 13, 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:621-623` — Weekly Review skill spec

  **Acceptance Criteria**:
  - [ ] Returns markdown summary of week's work
  - [ ] Mentions specific tasks, hours, projects

  **QA Scenarios**:
  ```
  Scenario: Weekly review generation
    Tool: Bash (curl)
    Steps:
      1. POST /api/ai/weekly-review {"dateFrom":"2026-04-13","dateTo":"2026-04-20"}
      2. Expect markdown text mentioning projects, hours worked, tasks completed
    Expected Result: Readable weekly summary
    Evidence: .sisyphus/evidence/task-45-weekly-review.txt
  ```

  **Commit**: YES
  - Message: `feat(ai): weekly review summary skill`

- [ ] 46. AI Chat Panel in Sidebar

  **What to do**:
  - React component `apps/web/src/features/ai/AIChatPanel.tsx`:
    - Collapsible panel on right side of app (toggle via button in top bar)
    - Chat-like UI: message bubbles (user + AI), text input at bottom
    - Context-aware: automatically includes current page context (project, task, etc.)
    - Quick actions: buttons for "Decompose Task", "Suggest Tasks", "Weekly Summary"
    - Message history per session (stored in state, not persisted)
    - Loading indicator while AI processes
    - Markdown rendering for AI responses (code blocks, lists, bold)
  - Backend: `POST /api/ai/chat` — { message, context: { projectId?, taskId? } } → AI response with FlowPilot context

  **Must NOT do**:
  - No persistent chat history (session only)
  - No streaming responses
  - No file/image upload

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.2 (with Tasks 42-45)
  - **Blocks**: Tasks 48, 49
  - **Blocked By**: Tasks 9, 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:643` — "AI Assistant panel v sidebar — chat s projektem/context"

  **Acceptance Criteria**:
  - [ ] Panel opens/closes from top bar button
  - [ ] Chat messages send and display AI response
  - [ ] Quick action buttons trigger appropriate skills
  - [ ] Markdown renders correctly in responses

  **QA Scenarios**:
  ```
  Scenario: AI chat interaction
    Tool: Playwright
    Steps:
      1. Navigate to project page → open AI panel
      2. Type "Suggest tasks for this project" → send
      3. Verify AI response appears with task suggestions in markdown
      4. Click "Decompose Task" quick action → verify sends appropriate prompt
      5. Screenshot
    Expected Result: Chat panel works with context
    Evidence: .sisyphus/evidence/task-46-ai-chat.png
  ```

  **Commit**: YES
  - Message: `feat(web): AI chat panel with context-aware sidebar`

### --- Wave 4.3: MCP + Integration ---

- [ ] 47. MCP Server — Resources + Tools

  **What to do**:
  - MCP server module `apps/api/src/mcp/`:
    - Implement MCP protocol (JSON-RPC over stdio or SSE)
    - Use `@modelcontextprotocol/sdk` package
    - Resources (read-only):
      - `flowpilot://projects` — list projects
      - `flowpilot://projects/:id` — project detail with stats
      - `flowpilot://tasks?project=:id` — project tasks
      - `flowpilot://tasks/:id` — task detail
      - `flowpilot://clients` — list clients
      - `flowpilot://invoices?status=open` — open invoices
      - `flowpilot://time-entries?date=today` — today's time entries
      - `flowpilot://my/assigned-tasks` — current user's tasks
    - Tools (actions):
      - `flowpilot.create_task` — create task in project
      - `flowpilot.update_task` — update task fields
      - `flowpilot.create_time_entry` — log time
      - `flowpilot.get_uninvoiced_entries` — unbilled time for project
      - `flowpilot.create_invoice_from_entries` — generate invoice
      - `flowpilot.get_project_stats` — budget vs actual
      - `flowpilot.list_projects` — list with filters
    - Prompts (pre-built):
      - `flowpilot://prompt/daily-review` — summarize today's progress
      - `flowpilot://prompt/invoice-prep` — review unbilled time
  - Auth: Implement API key system within this task:
    - Prisma model `ApiKey` (id, userId, name, hashedKey, lastUsedAt, createdAt, revokedAt)
    - CRUD endpoints: `POST /api/api-keys`, `GET /api/api-keys`, `DELETE /api/api-keys/:id` (requires JWT auth)
    - MCP auth guard: validate `Authorization: Bearer <api-key>` header, resolve user from key
    - Key generation: crypto.randomBytes(32), store SHA-256 hash, show raw key once on creation
  - Run as separate process or as HTTP SSE endpoint within NestJS

  **Must NOT do**:
  - No more than 8 tools (keep it focused)
  - No write access to settings or users
  - No file operations

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.3 (with Task 48)
  - **Blocks**: Task 49
  - **Blocked By**: Task 40

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:791-838` — MCP Server spec

  **Acceptance Criteria**:
  - [ ] ApiKey Prisma model + migration applied
  - [ ] API key CRUD endpoints work (create returns raw key, list shows masked keys, delete revokes)
  - [ ] MCP server responds to initialize, resources/list, tools/list
  - [ ] All 8 resources return correct data
  - [ ] All 7 tools execute correctly
  - [ ] Auth rejects invalid/revoked API keys with 401

  **QA Scenarios**:
  ```
  Scenario: MCP server interaction with API key auth
    Tool: Bash
    Preconditions: Running API with seeded user, at least one project and task in DB
    Steps:
      1. Login via POST /api/auth/login → get JWT token
      2. Create API key: POST /api/api-keys -H "Authorization: Bearer <jwt>" -d '{"name":"mcp-test"}' → save returned raw key
      3. Start MCP server (or connect via SSE)
      4. Send initialize request with API key in auth header → expect capabilities list
      5. Send resources/list → expect 8 resources
      6. Send resources/read "flowpilot://projects" → expect project list JSON
      7. Send tools/call "flowpilot.create_task" with valid params → expect task created
      8. Verify task exists via GET /api/tasks/:id
    Expected Result: MCP protocol works for reads and writes with API key auth
    Evidence: .sisyphus/evidence/task-47-mcp.txt

  Scenario: MCP rejects invalid/revoked API key
    Tool: Bash
    Steps:
      1. Send MCP initialize with random invalid key → expect 401/auth error
      2. Create API key, then revoke it via DELETE /api/api-keys/:id
      3. Send MCP initialize with revoked key → expect 401/auth error
    Expected Result: Invalid and revoked keys are rejected
    Evidence: .sisyphus/evidence/task-47-mcp-auth-error.txt
  ```

  **Commit**: YES
  - Message: `feat(mcp): MCP server with resources, tools, and prompts`

- [ ] 48. AI Action Buttons in UI

  **What to do**:
  - Add AI action buttons throughout the app:
    - Task detail: "AI Decompose" button → calls decompose skill → shows suggestions → confirm to create subtasks
    - Task create/edit: "AI Suggest" button near description field → AI suggests description based on name
    - Project view: "AI Generate Tasks" button → input form for project description → generates initial task structure
    - Invoice create: "AI Draft" button → generates invoice from time entries with AI-enhanced descriptions
    - Meeting notes: paste area in AI chat panel → "Extract Tasks" button → shows suggested tasks → bulk create
  - Each AI action: loading state, preview/review step before applying, cancel option
  - Error handling: show AI provider error gracefully, suggest retry

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4.3 (with Task 47)
  - **Blocks**: Task 49
  - **Blocked By**: Tasks 42, 43, 46

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:637-646` — AI Action Points

  **Acceptance Criteria**:
  - [ ] "AI Decompose" on task → suggests subtasks → creates on confirm
  - [ ] "AI Generate Tasks" on project → creates initial structure
  - [ ] Loading states and error handling work

  **QA Scenarios**:
  ```
  Scenario: AI decompose task flow
    Tool: Playwright
    Steps:
      1. Navigate to task detail
      2. Click "AI Decompose" button
      3. Verify loading spinner appears
      4. Verify suggestion panel shows 3-7 subtasks
      5. Confirm → verify subtasks created and visible
      6. Screenshot
    Expected Result: AI action buttons work end-to-end
    Evidence: .sisyphus/evidence/task-48-ai-buttons.png
  ```

  **Commit**: YES
  - Message: `feat(web): AI action buttons for decompose, generate, draft`

### --- Wave 4.4: Phase 4 Completion ---

- [ ] 49. Phase 4 Docker Deployment + AI Smoke Test

  **What to do**:
  - Full AI features smoke test with real AI provider
  - Test MCP server with external MCP client
  - Verify all Phase 1-3 features still work
  - Tag: `v0.4.0-phase4`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 50-52
  - **Blocked By**: Tasks 47, 48

  **Acceptance Criteria**:
  - [ ] All AI skills produce valid output
  - [ ] MCP server works with external client
  - [ ] No regressions

  **QA Scenarios**:
  ```
  Scenario: Full AI workflow
    Tool: Playwright + Bash
    Steps:
      1. Configure AI provider → test connection → success
      2. Create task → decompose via AI → confirm subtasks
      3. Paste meeting notes → extract tasks → bulk create
      4. Generate weekly review → verify markdown output
      5. Test MCP: list projects, create task via tool
    Expected Result: All AI features functional
    Evidence: .sisyphus/evidence/task-49-phase4-smoke.png
  ```

  **Commit**: YES
  - Message: `chore(deploy): Phase 4 AI deployment + smoke test`

### === PHASE 5: POLISH ===

### --- Wave 5.1: Collaboration ---

- [ ] 50. Comments/Discussion on Tasks

  **What to do**:
  - Backend `apps/api/src/comments/`:
    - Comment model: id, taskId FK, userId FK, body (markdown), createdAt, updatedAt
    - `GET /api/tasks/:id/comments` — list comments (chronological)
    - `POST /api/tasks/:id/comments` — create comment
    - `PUT /api/comments/:id` — edit own comment
    - `DELETE /api/comments/:id` — delete own comment (admin can delete any)
    - Mention support: `@username` in body → create notification for mentioned user
  - Frontend:
    - Comments section at bottom of task detail panel
    - Markdown editor (simple textarea with preview toggle)
    - @mention autocomplete
    - Edit/delete actions on own comments
    - "New comment" notification triggers

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.1 (with Tasks 51, 52)
  - **Blocks**: Task 58
  - **Blocked By**: Tasks 10, 9

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1107` — Comments/Discussion in Phase 5

  **Acceptance Criteria**:
  - [ ] CRUD on comments works
  - [ ] @mentions create notifications
  - [ ] Markdown renders in comments

  **QA Scenarios**:
  ```
  Scenario: Comment with @mention
    Tool: Playwright
    Steps:
      1. Open task detail → scroll to comments
      2. Type "Hey @admin, please review this" → submit
      3. Verify comment appears with rendered markdown
      4. Switch to mentioned user → verify notification received
    Expected Result: Comments with mentions and notifications
    Evidence: .sisyphus/evidence/task-50-comments.png
  ```

  **Commit**: YES
  - Message: `feat(comments): task comments with markdown and @mentions`

- [ ] 51. File Attachments — MinIO Upload, Preview

  **What to do**:
  - Backend `apps/api/src/attachments/`:
    - Attachment model: id, entityType (task/invoice/project), entityId, fileName, fileSize, mimeType, storagePath, uploadedBy FK, createdAt
    - `POST /api/attachments/upload` — multipart upload to MinIO, create record
    - `GET /api/attachments/:id` — download (stream from MinIO)
    - `GET /api/attachments/:id/preview` — thumbnail/preview (for images: resize, for PDF: first page)
    - `DELETE /api/attachments/:id` — delete from MinIO + DB
    - `GET /api/tasks/:id/attachments`, `GET /api/invoices/:id/attachments`
    - Size limit: 50MB per file (configurable in settings)
  - Frontend:
    - Drag-and-drop upload zone on task detail and invoice detail
    - Attachment list: file name, size, type icon, download button, delete button
    - Image preview inline (lightbox on click)
    - Upload progress indicator

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.1 (with Tasks 50, 52)
  - **Blocks**: Task 58
  - **Blocked By**: Tasks 10, 25

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1105-1106` — File attachments scope

  **Acceptance Criteria**:
  - [ ] Upload stores file in MinIO, creates DB record
  - [ ] Download streams from MinIO
  - [ ] Image preview works inline
  - [ ] Delete removes from both MinIO and DB

  **QA Scenarios**:
  ```
  Scenario: File upload and preview
    Tool: Playwright
    Steps:
      1. Open task detail → drag image file onto upload zone
      2. Verify upload progress bar → file appears in attachment list
      3. Click preview → verify image lightbox opens
      4. Click download → verify file downloads
      5. Click delete → confirm → verify removed from list
    Expected Result: Full attachment lifecycle
    Evidence: .sisyphus/evidence/task-51-attachments.png
  ```

  **Commit**: YES
  - Message: `feat(attachments): file upload to MinIO with preview and download`

- [ ] 52. Activity Log / Audit Trail

  **What to do**:
  - Backend `apps/api/src/activity/`:
    - ActivityLog model: id, userId FK, entityType, entityId, action (created/updated/deleted/status_changed/etc.), changes (JSON: { field: { old, new } }), createdAt
    - Auto-log on: task status change, task assignment, invoice status change, time entry create/update, project member add/remove
    - `GET /api/activity?entityType=task&entityId=<id>` — activity feed for entity
    - `GET /api/activity/recent` — recent activity across all entities (dashboard feed)
  - Frontend:
    - Activity tab on task/project/invoice detail pages
    - Timeline UI: avatar + "User X changed status from Y to Z" + timestamp
    - Dashboard recent activity widget (already placeholder from Task 35, now populate)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.1 (with Tasks 50, 51)
  - **Blocks**: Task 58
  - **Blocked By**: Task 2

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:859-864` — Activity Log spec

  **Acceptance Criteria**:
  - [ ] Activities logged on all defined triggers
  - [ ] Activity feed shows correct timeline per entity
  - [ ] Dashboard recent activity widget populated

  **QA Scenarios**:
  ```
  Scenario: Activity tracking
    Tool: Bash + Playwright
    Steps:
      1. Change task status via API → GET /api/activity?entityType=task&entityId=<id> → expect status change logged
      2. Playwright: open task detail → Activity tab → verify timeline shows status change
    Expected Result: Activities logged and displayed
    Evidence: .sisyphus/evidence/task-52-activity.txt
  ```

  **Commit**: YES
  - Message: `feat(activity): audit trail with auto-logging and timeline UI`

### --- Wave 5.2: Mobile + Automation ---

- [ ] 53. Mobile Responsive Polish

  **What to do**:
  - Audit all pages for mobile breakpoints (< 768px):
    - Sidebar: collapsible hamburger menu
    - Kanban: horizontal scroll with single column focus on mobile
    - List view: hide less important columns, horizontal scroll for rest
    - Dashboard: stack widgets vertically
    - Forms: full-width inputs, proper touch targets (min 44px)
    - Timer widget: floating action button on mobile
    - Navigation: bottom tab bar on mobile (Dashboard, Tasks, Time, More)
  - Test on: iPhone 14 Pro, iPad, Samsung Galaxy S24 viewport sizes
  - Touch-friendly: larger tap targets, swipe gestures for kanban

  **Must NOT do**:
  - No native app
  - No PWA (service worker) — just responsive web

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.2 (with Tasks 54, 55)
  - **Blocks**: Task 58
  - **Blocked By**: Task 9

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1039-1043` — Mobile responsive requirement

  **Acceptance Criteria**:
  - [ ] All pages usable on iPhone 14 Pro viewport
  - [ ] Sidebar collapses to hamburger
  - [ ] Touch targets >= 44px
  - [ ] Bottom nav bar on mobile

  **QA Scenarios**:
  ```
  Scenario: Mobile responsive check
    Tool: Playwright (mobile viewport)
    Steps:
      1. Set viewport to iPhone 14 Pro (390x844)
      2. Navigate to dashboard → verify widgets stacked vertically
      3. Open hamburger menu → navigate to tasks → verify kanban scrollable
      4. Open task detail → verify form inputs full-width
      5. Screenshot all key pages at mobile viewport
    Expected Result: All pages usable on mobile
    Evidence: .sisyphus/evidence/task-53-mobile.png
  ```

  **Commit**: YES
  - Message: `feat(web): mobile responsive polish with bottom nav and touch-friendly UI`

- [ ] 54. Automation Rules Engine

  **What to do**:
  - Backend `apps/api/src/automations/`:
    - AutomationRule model: id, name, isActive, trigger (enum), conditions (JSON), actions (JSON array), createdBy FK
    - Triggers (5 types):
      - `task.status_changed` — when task moves to specific status
      - `task.assigned` — when task is assigned
      - `task.overdue` — when task becomes overdue (cron check)
      - `invoice.overdue` — when invoice becomes overdue
      - `time_entry.created` — when time is logged
    - Actions (5 types):
      - `send_notification` — to specific user(s)
      - `send_email` — to email address
      - `change_task_status` — move task to status
      - `assign_task` — assign to user
      - `create_task` — create follow-up task
    - Conditions: simple field matching (e.g., "if project = X", "if priority = urgent")
    - API: CRUD on automation rules
    - Execution: event-driven via NestJS EventEmitter + handler that checks matching rules
  - Frontend: Settings → Automations page:
    - List of rules with enable/disable toggle
    - Create rule form: trigger selector → conditions builder (simple dropdowns) → actions list → save
    - Test button: simulate trigger and show what would happen

  **Must NOT do**:
  - No visual flow/diagram builder
  - No complex logic (just AND conditions, no OR/nested)
  - Max 50 rules per account

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.2 (with Tasks 53, 55)
  - **Blocks**: Task 58
  - **Blocked By**: Task 4

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1170` — Advanced automation/rules in Phase 5

  **Acceptance Criteria**:
  - [ ] CRUD on automation rules works
  - [ ] Rules trigger on defined events
  - [ ] Actions execute correctly (notification, email, status change)
  - [ ] Test simulation shows expected outcome

  **QA Scenarios**:
  ```
  Scenario: Automation rule execution
    Tool: Bash + Playwright
    Steps:
      1. Create rule: "When task status changes to Done → send notification to project admin"
      2. Move a task to Done via API
      3. Verify notification created for project admin
      4. Playwright: verify notification appears in bell
    Expected Result: Automation triggers and executes action
    Evidence: .sisyphus/evidence/task-54-automation.txt
  ```

  **Commit**: YES
  - Message: `feat(automations): rules engine with 5 triggers × 5 actions`

- [ ] 55. Webhooks Module

  **What to do**:
  - Backend `apps/api/src/webhooks/`:
    - Webhook model: id, url, events (JSON array of event types), secret, isActive, createdBy FK
    - Events: invoice.created, invoice.paid, task.status_changed, time_entry.created
    - Payload: { event, timestamp, data: { ...entity } }
    - HMAC-SHA256 signing with secret (X-Webhook-Signature header)
    - Retry: 3 attempts with exponential backoff (1s, 10s, 60s)
    - Delivery log: WebhookDelivery model (webhookId, event, statusCode, responseBody, attempts, createdAt)
    - API: CRUD on webhooks + `GET /api/webhooks/:id/deliveries` (delivery history)
  - Frontend: Settings → Webhooks page:
    - List of webhooks with last delivery status
    - Create: URL, select events, generate secret
    - Delivery log table

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.2 (with Tasks 53, 54)
  - **Blocks**: Task 58
  - **Blocked By**: Task 4

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:782-788` — Webhooks spec

  **Acceptance Criteria**:
  - [ ] Webhook delivers payload on event
  - [ ] HMAC signature validates correctly
  - [ ] Retry on failure (3 attempts)
  - [ ] Delivery log shows history

  **QA Scenarios**:
  ```
  Scenario: Webhook delivery
    Tool: Bash
    Steps:
      1. Start webhook receiver (nc -l or webhook.site)
      2. Create webhook targeting receiver URL, events: ["task.status_changed"]
      3. Change task status via API
      4. Verify receiver got POST with correct payload and X-Webhook-Signature header
      5. Validate signature: HMAC-SHA256(payload, secret) matches header
    Expected Result: Webhook delivered with valid signature
    Evidence: .sisyphus/evidence/task-55-webhooks.txt
  ```

  **Commit**: YES
  - Message: `feat(webhooks): configurable webhooks with HMAC signing and retry`

### --- Wave 5.3: Final ---

- [ ] 56. Calendar Sync — Google Calendar OAuth

  **What to do**:
  - Backend `apps/api/src/calendar-sync/`:
    - Google Calendar OAuth2 flow (consent → tokens → store)
    - Two-way sync: FlowPilot task deadlines → Google Calendar events, and vice versa
    - Sync logic: on task due date change → update Google event, on Google event change → update task due date
    - Background job: periodic sync check every 15 minutes (BullMQ cron)
    - Conflict resolution: last-write-wins with timestamp comparison
    - Settings: enable/disable, connected account display, sync scope (which projects)
  - Frontend: Settings → Integrations → Google Calendar:
    - "Connect Google Calendar" button → OAuth flow
    - Connected status with account email
    - Sync scope selector (all projects or specific)
    - Manual sync trigger button
    - Disconnect button

  **Must NOT do**:
  - No Outlook sync (separate task if needed later)
  - No meeting creation from FlowPilot
  - No calendar overlay in FlowPilot (just sync to external)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.3 (with Task 57)
  - **Blocks**: Task 58
  - **Blocked By**: Task 31

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:876-879` — Calendar Integration
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1119` — Google Calendar two-way sync

  **Acceptance Criteria**:
  - [ ] OAuth flow connects Google account
  - [ ] Task deadline changes reflect in Google Calendar
  - [ ] Google Calendar event changes reflect in FlowPilot
  - [ ] Periodic sync runs via cron

  **QA Scenarios**:
  ```
  Scenario: Google Calendar sync
    Tool: Bash + Playwright
    Steps:
      1. Playwright: Settings → connect Google Calendar → complete OAuth
      2. Create task with due date → verify event appears in Google Calendar (via Google API)
      3. Update event in Google Calendar → wait for sync → verify task due date updated
    Expected Result: Two-way sync works
    Evidence: .sisyphus/evidence/task-56-gcal-sync.txt
  ```

  **Commit**: YES
  - Message: `feat(calendar-sync): Google Calendar two-way sync via OAuth`

- [ ] 57. Performance Optimization + Synology Tuning

  **What to do**:
  - Backend optimizations:
    - Add database indexes for frequently queried fields (status, assigneeId, dueDate, projectId on tasks; projectId+userId on time_entries)
    - Implement response caching (Redis) for expensive queries (reports, project stats)
    - Optimize N+1 queries with Prisma `include` and `select`
    - Connection pooling: PgBouncer or Prisma connection pool settings
  - Frontend optimizations:
    - React.lazy for route-level code splitting
    - Bundle analysis (vite-plugin-visualizer) → identify large chunks
    - Image optimization (avatars, logos)
    - Virtualized lists for large datasets (react-virtuoso)
    - API response memoization (react-query/tanstack-query cache)
  - Synology-specific:
    - Tune PostgreSQL for limited RAM (shared_buffers, effective_cache_size)
    - Tune Node.js memory limits in Dockerfile
    - Redis maxmemory policy
    - Docker resource limits in compose file

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5.3 (with Task 56)
  - **Blocks**: Task 58
  - **Blocked By**: All previous tasks

  **References**:
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:1011-1017` — Performance requirements
  - `01-ARCHITEKTONICKÉ-ZADÁNÍ-FlowPilot.md:85-99` — Synology Docker constraints

  **Acceptance Criteria**:
  - [ ] Page loads < 2s (Lighthouse audit)
  - [ ] API 95th percentile < 500ms
  - [ ] Bundle size < 500KB gzipped (main chunk)
  - [ ] Docker containers stable on Synology for 24h

  **QA Scenarios**:
  ```
  Scenario: Performance benchmarks
    Tool: Bash
    Steps:
      1. Run Lighthouse on dashboard page → verify performance score > 80
      2. Load test API: 100 concurrent requests to /api/tasks → verify p95 < 500ms
      3. Check bundle size: vite build → verify main chunk < 500KB gzipped
      4. Docker stats after 24h: no memory leaks, containers stable
    Expected Result: All performance targets met
    Evidence: .sisyphus/evidence/task-57-performance.txt
  ```

  **Commit**: YES
  - Message: `perf: optimization pass — indexes, caching, code splitting, Synology tuning`

- [ ] 58. Final Docker Deployment + Comprehensive E2E Test Suite

  **What to do**:
  - Comprehensive Playwright E2E test suite covering all major flows:
    - Auth: register, login, logout, refresh, unauthorized access
    - Projects: create, clone, archive, members, dashboard
    - Tasks: create, subtasks, kanban drag, list edit, filters, saved views
    - Time: timer lifecycle, manual entry, reports
    - Clients: create with ARES, contacts
    - Invoices: create, from entries, PDF download, send, pay
    - AI: decompose task, meeting notes, chat panel
    - Calendar, Gantt, Dashboard widgets
    - Notifications, comments, attachments
    - Settings (all sections)
    - Mobile viewport tests
  - Final Docker Compose: production-ready with all services
  - Documentation: `DEPLOYMENT.md` with Synology-specific instructions
  - Tag: `v1.0.0`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 50-57

  **Acceptance Criteria**:
  - [ ] All E2E tests pass
  - [ ] Docker deployment works from scratch on Synology
  - [ ] Tag v1.0.0 created and pushed

  **QA Scenarios**:
  ```
  Scenario: Complete E2E regression
    Tool: Playwright
    Steps:
      1. docker compose down -v && docker compose up -d
      2. Run full Playwright test suite: pnpm --filter=@flowpilot/web test:e2e
      3. All tests pass
    Expected Result: 100% E2E pass rate
    Evidence: .sisyphus/evidence/task-58-e2e-results.txt
  ```

  **Commit**: YES
  - Message: `chore: v1.0.0 — final deployment, E2E suite, documentation`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (`docker compose down -v && docker compose up -d`). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Remote**: `https://github.com/powizak/FlowPilot.git` (account: powizak)
- **Push policy**: Push to remote after EVERY task commit (`git push origin main`)
- After each task: atomic commit with `type(scope): description` → push
- After each wave: verify all commits are clean, no merge conflicts
- After each phase: tag release (e.g., `v0.1.0-phase1`) → `git push origin --tags`
- Pre-commit: `tsc --noEmit && vitest run --reporter=verbose`

---

## Success Criteria

### Verification Commands
```bash
docker compose up -d          # Expected: all containers healthy
curl http://localhost:3000/api/health  # Expected: {"status":"ok"}
curl -X POST http://localhost:3000/api/auth/login -d '{"email":"admin@local","password":"admin"}' # Expected: JWT token
pnpm test                     # Expected: all tests pass
pnpm build                    # Expected: clean build, no errors
```

### Final Checklist
- [ ] All "Must Have" features present and functional
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] All tests pass (`vitest run`)
- [ ] Docker deployment works on Synology NAS
- [ ] Invoice PDF contains all Czech legal requirements
- [ ] SPAYD QR code decodes to valid payment data
- [ ] AI skills return structured output
- [ ] MCP server responds to requests
- [ ] All settings configurable via UI
- [ ] i18n works (CZ + EN toggle)
