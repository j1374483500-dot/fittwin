# FitTwin MCP: local AI integration

`@fittwin/mcp` makes FitTwin an AI-callable capability layer instead of a website-only tool. It uses MCP stdio: the AI client starts a local child process and exchanges JSON-RPC over standard input/output. The server does not open a network port, call a model provider, or write to the vault.

## Create a local Agent Vault

1. In the personal PWA, save your profile and optionally add wardrobe items and size tables.
2. Enter a backup password of at least 10 characters.
3. Choose **Export AI vault**. Keep the resulting `fittwin-agent-vault.encrypted.json` in a private local folder.

The password is not saved in the PWA, in the Vault, or by the MCP process. An Agent Vault is intentionally separate from the profile-only backup format.

## Client-neutral configuration

Build the project, then configure your MCP-capable AI client to launch the built server as a local process. Substitute absolute paths on your own computer:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/fittwin/packages/mcp/dist/server.js"],
  "env": {
    "FITTWIN_VAULT_PATH": "/absolute/path/to/fittwin-agent-vault.encrypted.json",
    "FITTWIN_VAULT_PASSWORD": "your-vault-password"
  }
}
```

You can also run it manually for diagnostics (it will wait for an MCP client on standard input):

```bash
FITTWIN_VAULT_PATH='/absolute/path/to/fittwin-agent-vault.encrypted.json' \
FITTWIN_VAULT_PASSWORD='your-vault-password' \
pnpm --filter @fittwin/mcp dev
```

Do not put a Vault password in a shared configuration repository, screen recording, or untrusted client setup.

## Available tools

| Tool | What the AI receives | What it never receives |
| --- | --- | --- |
| `fittwin_get_profile_summary` | goals, occasions, fit preference, derived proportion notes | profile ID, raw height/shoulder/chest/waist/hip/inseam values |
| `fittwin_recommend_outfit` | a deterministic selection from the exported wardrobe | product links, web results, purchase actions |
| `fittwin_assess_garment_fit` | recommendation, confidence, and per-area garment differences | raw profile values or a fit guarantee |

By default, all tools are read-only in this alpha. FitTwin does not let an AI client modify the profile, export data, invoke an external model, access photos, or run a virtual try-on.

## Optional feedback writes

By default, the feedback-write tool is absent. If you deliberately want a trusted AI client to record a simple `like` or `dislike` reaction to a named style trait, add this environment variable to that client's local MCP configuration:

```json
"FITTWIN_ALLOW_WRITES": "true"
```

This enables only `fittwin_record_style_feedback`. It appends a validated feedback item to the encrypted Vault using an atomic local replacement; it does not change the browser database, contact a service, or grant the client general profile-editing access. To bring the feedback back into the personal app, choose **Import backup** and select that encrypted Agent Vault with its password. The import is a user-initiated replacement of the local profile, wardrobe, and saved size tables.

Leave this setting absent for the normal read-only mode. Review every write request in your AI client before approving it.

## Consent boundary

MCP clients decide when to request a tool, and their host can see each result it receives. Review the tool request in your AI client and connect only a client you trust. The encrypted Vault protects the data at rest; it does not prevent a connected client from seeing the result of a tool that you authorize.

FitTwin follows the MCP local-process model and keeps diagnostic output on standard error so standard output remains reserved for MCP messages. The choice of stdio is deliberate for this alpha: it avoids a LAN/public endpoint and avoids exposing personal body data through an HTTP service.
