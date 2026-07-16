# Privacy design

FitTwin is local-first by design:

- The core SDK uses in-memory storage by default and never performs network requests.
- The personal PWA uses IndexedDB only for the profile and local recommendation feedback. It has no account, analytics, telemetry, or API-key persistence.
- Export produces a user-controlled JSON file. Delete removes the PWA profile from IndexedDB.
- An optional encrypted backup uses a locally derived AES-GCM key. The password is not stored, transmitted, or recoverable by FitTwin.
- The optional Agent Vault uses the same local AES-GCM encryption to package only the profile, manually saved wardrobe items, and manually saved garment tables for `@fittwin/mcp`. It is created only when the user chooses **Export AI vault**.
- The MCP server is read-only and runs as a local stdio child process. It has no HTTP endpoint, telemetry, model-provider credential, or network request. A connected AI client can see the result of each tool it is allowed to invoke; encryption at rest does not override that client-side disclosure.
- AI generation is disabled until the user selects consent, starts their own local companion, and supplies its one-time pairing token.
- The companion reads the provider credential only from its current process environment. It binds to `127.0.0.1` and rejects other origins unless explicitly configured.

An AI provider is an external service selected by the user. Its own privacy, retention, and billing terms apply to a consented request. Do not use FitTwin to make medical, employment, insurance, or similarly high-impact decisions.
