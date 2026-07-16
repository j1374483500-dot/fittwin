# FitTwin: consented agent feedback loop

## Goal

Let an AI client record a narrowly scoped like/dislike style feedback event only after a user enables write access, then let the user explicitly import that encrypted Agent Vault into the PWA.

## Boundaries

- `FITTWIN_ALLOW_WRITES=true` is required; the default MCP server remains read-only.
- The only write is a validated feedback item (`trait`, `like` or `dislike`) appended to the encrypted Vault.
- The server rewrites only the configured local Vault using AES-GCM and an atomic replacement; it never writes browser storage, opens a port, or calls a network service.
- The PWA imports a Vault only when the user chooses its file and knows its password.

## Verification

- Disabled write tool returns an error without changing the Vault.
- Enabled write survives a reload of the encrypted file.
- PWA import restores profile, wardrobe, and garment tables from a user-selected Vault.
- Full typecheck, test suite, build, and browser import pass.

## Evidence — 2026-07-16

- MCP stdio integration test verified the write tool is absent by default, then enabled it with `FITTWIN_ALLOW_WRITES=true`, recorded `short jacket: like`, and reloaded the encrypted Vault to confirm persistence.
- A browser-generated Agent Vault was updated locally, then selected through the PWA file chooser. The PWA reported that the AI vault had been imported to the device.
