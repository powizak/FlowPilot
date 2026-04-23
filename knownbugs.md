# Known Bugs

Tracking file for bugs discovered during work but out of scope for the current task. Remove entries when fixed (with commit reference).

## Open

_(none)_

## Fixed

- [projects] Dashboard on `/projects` stayed on "Loading dashboard" because dashboard data request returned 404. Fixed in `2cd6d62` on 2026-04-23.
- [projects] Creating a task from `/projects` failed because `POST /api/tasks` returned 404. Fixed in `b73632d` on 2026-04-23.
- [projects] Opening the `List` tab on `/projects` failed because task fetch returned 400. Fixed in `579c86d` on 2026-04-23.
- [calendar] Calendar task loading used the removed flat `GET /api/tasks` route and also read responses without unwrapping the `{ data }` envelope; time entries were sent with `from`/`to` instead of `dateFrom`/`dateTo` and came back unfiltered. Fixed in `364b2b1` on 2026-04-23.
