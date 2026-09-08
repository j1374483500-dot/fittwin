# Changelog

## 0.1.0-alpha.2 — prepared 2026-09-08

This source revision prepares the next GitHub prerelease. It does not imply npm publication.

### Added since alpha.1

- Browser-local wardrobe storage, deterministic outfit recommendations, and an offline base style guide; no provider key is required for these features (`f007619`).
- A personal garment size-check form with saved top/bottom charts and per-area measurement differences (`de37172`).
- Encrypted Agent Vault export and a local stdio MCP integration for profile summaries, wardrobe recommendations, and garment-fit assessment (`fa0e85c`).
- An explicitly opt-in MCP feedback-write tool and user-initiated vault import to carry feedback back into the PWA (`b27d457`).
- A fourth default read-only MCP tool that generates an offline structured style brief using preferences and recorded feedback (`84310c0`).

### Release and maintenance

- GitHub Pages deployment and an explicit workspace dependency build for the personal app (`f007619`, `6be2923`).
- npm publication made opt-in in the alpha release workflow; a GitHub prerelease can be created without npm credentials (`08568d4`).
- README now links the live demo, records the published alpha.1 release, and describes four default read-only MCP tools plus optional feedback writes.
- Workspace package versions, MCP runtime version, and the release workflow default advance together to alpha.2.
- Refresh vulnerable transitive dependencies within compatible version ranges; see the verification note below.

### Maintenance verification (2026-09-08)

On macOS with Node.js 22.22.2 and the pinned pnpm 11.9.0:

- Frozen-lockfile installation, workspace typecheck, all 18 tests, and the full build passed.
- Production dependency audit reported no known vulnerabilities after the lockfile refresh.
- The all-dependency high-severity audit passed. A low-severity [esbuild development-server advisory](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) remains in the development-only `tsup` dependency tree (esbuild 0.27.7); moving it to 0.28.x exceeds its declared range and is deferred to a separately verified build-tool update. These checks do not use the esbuild development server.
- Provider calls and npm publication were not exercised.

### Limitations

- Alpha software; sizing uses manually entered measurements and charts and is not a guarantee of fit, a body scan, or medical advice.
- Browser data stays in that browser. An Agent Vault is an exported snapshot; MCP feedback reaches the browser only after the user imports it. There is no automatic sync.
- MCP results are visible to the connected AI client. Encrypted storage does not hide authorized tool results from that client.
- Provider-generated guidance requires a separately configured local companion and explicit consent. Offline guidance is deterministic, not an externally validated stylist or model evaluation.
- This maintenance does not publish packages to npm. Build and run from the source checkout.

## 0.1.0-alpha.1 — 2026-07-16

Initial [GitHub prerelease](https://github.com/j1374483500-dot/fittwin/releases/tag/v0.1.0-alpha.1): manual measurement profiles, a neutral 2D silhouette, transparent garment matching, TypeScript SDK and React component, personal PWA, and a consent-gated local AI companion.
