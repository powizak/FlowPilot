# Known Bugs

Tracking file for bugs discovered during work but out of scope for the current task. Remove entries when fixed (with commit reference).

## Open

### FE-4: Workspace-wide frontend lint debt blocks full `pnpm lint`

- **Scope**: Frontend, many files outside the current bugfix (`AIActionButton.tsx`, `AIChatPanel.tsx`, `ProjectDashboard.tsx`, `TaskDetailPanel.tsx`, …)
- **Symptom**: Full `turbo run lint --filter @flowpilot/web` still fails after FE-1 because of pre-existing `no-explicit-any`, unused vars, empty blocks, and missing ESLint rule config issues.
- **Cause**: Older files accumulated lint violations and some rules reference plugins/config that are not fully wired.
- **Risk**: Repo-level lint remains red, which hides regressions and makes targeted fixes harder to verify globally.
- **Fix sketch**: Triage by category: first remove broken rule references/config issues, then clear `any` / unused-vars / empty-block violations module by module.
