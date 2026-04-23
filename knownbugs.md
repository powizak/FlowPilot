# Known Bugs

Tracking file for bugs discovered during work but out of scope for the current task. Remove entries when fixed (with commit reference).

## Open

## Fixed

- [search] Top search returned nothing because `plainto_tsquery` only matched whole words and the invoice/client SQL referenced non-existent snake_case columns (schema uses quoted camelCase for those tables). Switched to ILIKE substring matching with escaped patterns and corrected column identifiers. Fixed on 2026-04-24.

- [projects] Dashboard on `/projects` stayed on "Loading dashboard" because dashboard data request returned 404. Fixed in `2cd6d62` on 2026-04-23.
- [projects] Creating a task from `/projects` failed because `POST /api/tasks` returned 404. Fixed in `b73632d` on 2026-04-23.
- [projects] Opening the `List` tab on `/projects` failed because task fetch returned 400. Fixed in `579c86d` on 2026-04-23.
- [calendar] Calendar task loading used the removed flat `GET /api/tasks` route and also read responses without unwrapping the `{ data }` envelope; time entries were sent with `from`/`to` instead of `dateFrom`/`dateTo` and came back unfiltered. Fixed in `364b2b1` on 2026-04-23.
- [tasks] Duplicate `handleUpdateTask` declaration in `KanbanView.tsx` caused `TS1005: "}" expected`, breaking the web build. Fixed in `5614a0a` on 2026-04-23.
- [invoices] `AIActionButton<TResult>` in `InvoiceForm.tsx` was instantiated without its generic argument, leaving `result` typed `unknown` (7 TS18046 errors). Fixed in `de64304` on 2026-04-23.
- [settings-web] Narrow object-literal types on `defaultGeneralSettings`, `defaultInvoiceSettings`, `defaultTimeTrackingSettings` caused TS7053 when indexed with a generic `string` key, plus a TS2345 from piping `string | number` into `getPreview`. Fixed in `67d863a` on 2026-04-23.
- [api-tests] `projects.service.spec.ts` fixtures were out of sync with production types: `AuthenticatedUser` needed `name`, and `hourlyRateDefault` had to be a `Prisma.Decimal` rather than a plain number. Fixed in `500aa9b` on 2026-04-23.
