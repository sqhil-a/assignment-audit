# AI and comparison verification

Verified locally on September 12, 2026 with Groq `openai/gpt-oss-20b`.

- `pnpm check`: strict TypeScript, 26 automated tests, and Vite production build passed.
- Direct live integration: original assignment plus revision passed in 69 seconds.
- HTTP integration through `http://127.0.0.1:5173/api/audit`: original assignment plus revision passed in 92 seconds. This uses the frontend service, local proxy, actual Groq requests, response validation, and comparison validation.
- `/api/health`: returned a successful model connection without transmitting assignment text.
- Credential scan: no configured API key found in `src`, `dev`, or `dist`.

The live test uses a synthetic school-garden argument with instructions, a rubric, and teacher comments. It verifies live report metadata, rubric/feedback processing, a second version, and tracking of every prior priority. The validators additionally reject fabricated source quotes, invalid source identifiers, mismatched versions, and unverified before/after text.

Run the HTTP integration with the local app already running:

```sh
RUN_LIVE_TESTS=1 LIVE_AUDIT_URL=http://127.0.0.1:5173/api/audit pnpm test tests/live.test.ts
```

Live tests require a configured local key and consume provider quota. Response times vary with Groq rate limits. GitHub Pages remains Demo Mode until a secure external endpoint is configured at build time; the local development server is not deployed with the static site.
