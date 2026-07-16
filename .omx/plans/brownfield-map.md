# FitTwin agent-native boundary map

## Existing boundaries to preserve

- `@fittwin/core` owns schemas, unit normalization, outfit recommendation, and transparent garment fit scoring. It has no network or Node-only dependency.
- The personal PWA owns browser IndexedDB and the user's local interaction flow.
- `@fittwin/local-companion` is an optional loopback HTTP bridge for a user-selected provider; provider credentials must remain outside the PWA.
- The default SDK remains in-memory and network-free.

## Recommended path

Add a separate `@fittwin/mcp` package using MCP stdio. It reads a user-exported, AES-GCM encrypted Agent Vault from an explicitly configured local path and password environment variable. It exposes only narrowly scoped tools; it never binds a port, writes to the vault, calls a model provider, or emits diagnostics on stdout.

## Agent tool privacy boundary

- `fittwin_get_profile_summary`: proportions and preferences only; never raw measurements or profile ID.
- `fittwin_recommend_outfit`: returns a deterministic selection from the user's exported wardrobe.
- `fittwin_assess_garment_fit`: accepts a caller-supplied standard `GarmentSpec`, performs comparison locally, and returns only the assessment.
- The initial server is read-only. Feedback writes, direct PWA synchronization, remote HTTP, photos, and provider calls remain out of scope.

## Risks and mitigations

- Browser IndexedDB cannot safely be read by a child process: use an explicit encrypted export rather than hidden synchronization.
- MCP stdio reserves stdout for JSON-RPC: startup/error messages use stderr only.
- A host can see every tool result it receives: tool descriptions, documentation, and minimized outputs must make this visible to users.
- Existing encrypted profile backups remain compatible; Agent Vault is a separately versioned encrypted JSON payload.
