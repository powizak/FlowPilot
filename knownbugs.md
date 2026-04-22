# Known Bugs

Tracking file for bugs discovered during work but out of scope for the current task. Remove entries when fixed (with commit reference).

## Open

### FE-1: Systemic `<label>` / `htmlFor` lint warnings

- **Scope**: Frontend, many files (`ClientForm.tsx`, `InvoiceForm.tsx`, `Login.tsx`, …)
- **Symptom**: Biome/ESLint reports `A form label must be associated with an input.` across the codebase.
- **Cause**: The project uses label-wraps-children pattern without explicit `htmlFor`/`id` pairing. Lint rule requires the pairing for accessibility.
- **Risk**: Accessibility regression for screen readers; lint noise.
- **Fix sketch**: Add `id` to every input and `htmlFor={id}` to its label. Broader pass - not tied to a single feature.

### FE-2: Missing `useEffect` dependencies across features

- **Scope**: `ClientForm.tsx`, `ClientDetail.tsx`, `BankAccountsSettings.tsx`, …
- **Symptom**: `react-hooks/exhaustive-deps` reports missing deps (e.g. `fetchClient`, `fetchTabData`, `lookupIco`, `formData.country`).
- **Cause**: Async fetchers declared inside components without `useCallback`, used in `useEffect` without being listed as deps.
- **Risk**: Potential stale closures when props change.
- **Fix sketch**: Wrap fetchers in `useCallback` with proper deps and add them to `useEffect` deps. Alternatively migrate to TanStack Query (not yet installed, only `@tanstack/react-table`).

### FE-3: Missing explicit `type` attribute on `<button>` elements

- **Scope**: `ClientDetail.tsx` (4 occurrences), likely others.
- **Symptom**: `useButtonType` lint warning.
- **Cause**: Buttons inside forms default to `type="submit"` which has caused real bugs before (the `/time` tab toggle issue fixed in `ce88832`).
- **Risk**: Accidental form submission when clicking non-submit buttons.
- **Fix sketch**: Add `type="button"` everywhere a button is not the explicit submit button.
