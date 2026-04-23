# Known Bugs

Tracking file for bugs discovered during work but out of scope for the current task. Remove entries when fixed (with commit reference).

## Open

- [projects] Opening the `List` tab on `/projects` fails because task fetch returns 400. Reported 2026-04-23.
- [calendar] Calendar task loading still uses legacy `GET /api/tasks` filtering even though the backend no longer exposes a flat task collection route. Found while fixing `/projects` on 2026-04-23.

## Fixed

- [projects] Dashboard on `/projects` stayed on "Loading dashboard" because dashboard data request returned 404. Fixed in `2cd6d62` on 2026-04-23.
- [projects] Creating a task from `/projects` failed because `POST /api/tasks` returned 404. Fixed in `b73632d` on 2026-04-23.
