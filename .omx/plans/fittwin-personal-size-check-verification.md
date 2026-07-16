# Personal size check verification

- `pnpm typecheck` succeeds.
- `pnpm test` succeeds, including independent IndexedDB garment-table persistence.
- `pnpm build` succeeds.
- Browser pass: save a profile, enter a top size table, save it locally, and see the recommended size plus per-area explanations.
- Browser pass: no profile or insufficient size-chart values gives a clear state instead of a fabricated recommendation.
- Browser network activity contains no external brand/product request.

## Evidence — 2026-07-16

- `pnpm typecheck`, `pnpm test` (15 tests), `pnpm build`, and `git diff --check` passed.
- A real local-browser pass saved a profile, added a top table named `日常牛津衬衫` with M / 44 cm shoulder / 108 cm chest, persisted it in IndexedDB, and displayed M with high confidence and +2 cm shoulder / +18 cm chest explanation.
- The UI states that the table is manual and local-only. The flow made no brand or product-page request.
