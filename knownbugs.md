# Known Bugs

Tracking file for bugs discovered during work but out of scope for the current task. Remove entries when fixed (with commit reference).

## Open

- [settings-web] `apps/web/src/features/settings/sections/GeneralSettings.tsx:57` — TS7053: indexing `defaultGeneralSettings` (typed literal `{ appName; locale; timezone; currency }`) with a generic `string` key from a forEach callback. Same root cause pattern in `InvoiceSettings.tsx:30` and `TimeTrackingSettings.tsx:43`.
- [settings-web] `apps/web/src/features/settings/sections/InvoiceSettings.tsx:110` — TS2345: passing `string | number` into a `string`-typed param (number-valued setting piped into a string input/select value).
- [api-tests] `apps/api/src/projects/projects.service.spec.ts:18` — TS2741: test fixture `AuthenticatedUser` missing required `name` property.
- [api-tests] `apps/api/src/projects/projects.service.spec.ts:94,122` — TS2345: test fixtures pass `hourlyRateDefault: number` where Prisma expects `Decimal`. Blocks `tsc` on the api package.

## Fixed

- [projects] Dashboard on `/projects` stayed on "Loading dashboard" because dashboard data request returned 404. Fixed in `2cd6d62` on 2026-04-23.
- [projects] Creating a task from `/projects` failed because `POST /api/tasks` returned 404. Fixed in `b73632d` on 2026-04-23.
- [projects] Opening the `List` tab on `/projects` failed because task fetch returned 400. Fixed in `579c86d` on 2026-04-23.
- [calendar] Calendar task loading used the removed flat `GET /api/tasks` route and also read responses without unwrapping the `{ data }` envelope; time entries were sent with `from`/`to` instead of `dateFrom`/`dateTo` and came back unfiltered. Fixed in `364b2b1` on 2026-04-23.
- [tasks] Duplicate `handleUpdateTask` declaration in `KanbanView.tsx` caused `TS1005: "}" expected`, breaking the web build. Fixed in `5614a0a` on 2026-04-23.
- [invoices] `AIActionButton<TResult>` in `InvoiceForm.tsx` was instantiated without its generic argument, leaving `result` typed `unknown` (7 TS18046 errors). Fixed in `de64304` on 2026-04-23.
