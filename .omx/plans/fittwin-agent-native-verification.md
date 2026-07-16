# Agent-native verification

- Existing profile encrypted backups still round trip.
- Agent Vault encrypts profile, wardrobe, and garment tables; wrong password fails.
- MCP summary does not contain profile ID or raw measurement values.
- MCP outfit and garment-fit calls return validated structured results.
- A real stdio MCP client discovers and calls the three tools.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` pass; no network is required by the MCP server.

## Evidence — 2026-07-16

- Full workspace typecheck, 18-test suite, production build, and diff whitespace check passed.
- MCP's own test spawns the built `fittwin-mcp` through the actual stdio client transport, discovers all three tools, and calls summary, outfit, and garment-fit tools.
- Browser flow saved a profile, required a password, and downloaded `fittwin-agent-vault.encrypted.json` only after the user clicked **Export AI vault**.
- The MCP vault loader successfully decrypted that browser-produced file and the resulting profile summary contained neither the profile ID nor the raw 170 cm height.
