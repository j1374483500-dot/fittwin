# FitTwin agent-native alpha

## Goal

Make FitTwin a local capability provider for AI clients while retaining the PWA as the user's private data and consent surface.

## Slice 1: versioned encrypted Agent Vault

**Files:** `packages/core/src/index.ts`, `apps/personal-web/src/backup.ts`, `apps/personal-web/src/backup.test.ts`

Define a validated `AgentVault` with profile, wardrobe, and saved garment tables. Generalize browser encryption without breaking profile-backup imports. The payload is AES-GCM encrypted using the existing PBKDF2 parameters.

## Slice 2: PWA export and consent copy

**Files:** `apps/personal-web/src/app.tsx`, `apps/personal-web/src/styles.css`, `docs/privacy.md`

Add an explicit Agent Vault export action. It requires the existing backup password and explains that a connected AI host can see a tool result only when it asks for that tool. The PWA must not store the password or start an MCP service.

## Slice 3: local MCP server

**Files:** `packages/mcp/*`, `package.json`, `pnpm-lock.yaml`

Create `@fittwin/mcp` with MCP stdio transport and three read-only structured tools: profile summary, outfit recommendation, and garment fit assessment. Load and decrypt the vault only from `FITTWIN_VAULT_PATH` plus `FITTWIN_VAULT_PASSWORD`.

## Slice 4: setup and contract verification

**Files:** `README.md`, `docs/mcp.md`, tests in `packages/mcp/test/*`, `.omx/plans/fittwin-agent-native-verification.md`

Document client-neutral setup and data disclosure. Verify vault encryption, raw-measurement exclusion from the summary, tool outputs, and an actual stdio MCP client round trip.
