# FitTwin: personal size check

## Goal

Turn the existing transparent `GarmentSpec` SDK capability into a useful personal-PWA flow: a person can enter a brand's size-table measurements, save that table locally, and see a recommended size with the actual measurement differences.

## Boundaries

- Keep the product local-first: garment tables stay in IndexedDB and no request is made to a brand or product page.
- Support only the existing `top` and `bottom` specification contract in this slice.
- Make the UI understandable without technical JSON or an account.
- Preserve the existing SDK schema and scoring logic; this slice connects it to the PWA rather than changing the public contract.

## Slice 1: local garment-table storage

**Files:** `apps/personal-web/src/store.ts`, `apps/personal-web/src/store.test.ts`

Add an IndexedDB object store and a small validated repository for `GarmentSpec`. Verify that saving, listing, deleting, and clearing a size table is independent from profile and wardrobe data.

## Slice 2: personal size-check UI

**Files:** `apps/personal-web/src/app.tsx`, `apps/personal-web/src/styles.css`

Add a localized size-table editor with one or more size rows. The editor must present only relevant measurements for tops or bottoms, persist the table only when valid, calculate fit from the saved profile, and show recommendation, confidence, per-area differences, and an explicit missing-data state.

## Slice 3: documentation and verification

**Files:** `README.md`, `docs/data-format.md`, `.omx/plans/fittwin-personal-size-check-verification.md`

Explain the personal workflow and its limits. Run the workspace typecheck, tests, production build, and a browser pass that creates a profile, records a size table, and displays an assessment.
