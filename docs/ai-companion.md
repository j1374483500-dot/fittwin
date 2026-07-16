# Local AI companion

The companion is a small loopback HTTP process that keeps an OpenAI-compatible API key out of browser storage.

```bash
export FITTWIN_API_KEY='...'
export FITTWIN_BASE_URL='https://provider.example/v1'
export FITTWIN_MODEL='model-name'
pnpm --filter @fittwin/local-companion dev
```

It prints a fresh pairing token unless `FITTWIN_PAIRING_TOKEN` is provided. Enter that token in the PWA for the current session. The process accepts only `POST /v1/style-guide`, checks the token, limits JSON payloads to 64 KB, and validates provider output against the FitTwin style-guide schema.

For a production static-site origin, set `FITTWIN_ORIGIN=https://your-site.example`. Do not expose the companion to a LAN interface or deploy it as a public API without adding authentication, rate limiting, logging policy, and a separate threat model.
