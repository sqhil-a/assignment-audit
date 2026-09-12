# Assignment Audit

A minimal, dark React application for reviewing assignments against instructions, rubrics, teacher feedback, and supporting materials. Structured reports connect specific evidence to priority fixes, then track improvements across revisions.

## Run locally

Requires **Node.js 24+** and **pnpm 11**.

```sh
pnpm install
cp .env.example .env.local
# Add GROQ_API_KEY to .env.local for live development analysis.
pnpm dev
```

Open the URL printed by Vite. The local development proxy uses **Groq / openai/gpt-oss-20b**. The key is read by Vite's server, never exposed to the browser. `.env.local` is ignored by Git. Without a key or external endpoint, the app uses clearly labeled sample reports.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

`pnpm check` runs the type check, service tests, and production build. Live integration tests are opt-in and use only synthetic test content:

```sh
RUN_LIVE_TESTS=1 pnpm test tests/live.test.ts
```

## GitHub Pages

1. Push this repository to GitHub with `main` as the default branch.
2. Under **Settings → Pages**, select **GitHub Actions** as the source.
3. The included workflow tests, builds, and deploys `dist/` on pushes to `main`.
4. For live production analysis, configure the repository **variable** `VITE_AUDIT_API_URL` with the HTTPS URL of your secure external proxy. Without it, the deployed app uses Demo Mode.

The relative Vite base (`./`) and hash routing work at both `https://username.github.io/` and `https://username.github.io/assignment-audit/`. Reloading a report works without a server-side SPA fallback. PDF workers and lazy chunks use the same base. A custom deployment can override `VITE_BASE_PATH`.

**Do not add a provider key to GitHub Pages, source code, localStorage, or any `VITE_` variable.** The development proxy is excluded from the production site. GitHub Pages runs only static files and cannot host this proxy.

References: [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## AI architecture

The UI calls `auditAssignment(input, signal)`. The service validates the input, chooses an explicit demo or API provider, validates the returned JSON, verifies source identifiers and quotations, and checks revision completeness. API errors never silently become sample feedback.

The external proxy contract is documented in [docs/api.md](docs/api.md). Zod schemas in `src/types/audit.ts` define the response and project formats. `src/services/instructions.ts` contains the analysis instructions. `dev/groqProxy.ts` is a working local reference implementation using Groq's structured JSON output.

Two structured stages independently evaluate the current assignment: overview and detailed review. A separate model call compares the result with the preceding assignment and audit recommendations, while also receiving the original assignment. Each previous priority is tracked exactly once; changes, new issues, regressions, rubric progress, and teacher-feedback progress are stored with the new version. The service verifies quoted before/after excerpts and derives comparison counts from the actual classifications.

For production, run the proxy on a secure external service with secret storage, appropriate authentication, rate limits, request limits, and CORS configured for the Pages origin. Keep provider-specific behavior behind the existing service boundary.

## Documents

- **TXT / MD:** native browser text reading.
- **DOCX:** Mammoth raw-text extraction; no document HTML is rendered.
- **PDF:** PDF.js with a bundled local worker; extracted pages retain actual page markers.
- Maximum 15 MB per file, 200 PDF pages, 160,000 extracted characters per source, 24 sources, and 600,000 characters per audit. The development provider has an additional combined request limit to leave room for model output.
- Empty, damaged, oversized, and unsupported documents produce explicit errors. Image-only PDFs are rejected with a scanned-document explanation; partly scanned PDFs show a warning. No OCR, visual-layout inspection, or image analysis is claimed.

## Local history and export

Each assignment is a local project with immutable source snapshots, report JSON, comparisons, and checklist state for every version. Supporting materials carry forward into a revision and can be edited. The original files are not retained. Names can be changed and projects deleted from History.

History is saved to this browser's `localStorage`. It is not synced across devices. Storage failures preserve the current work in memory and display a warning; export before closing. Settings includes a raw history/recovery backup export. Clearing browser data removes saved history. Avoid editing the same assignment in multiple tabs simultaneously.

Reports offer a copied summary, complete JSON export, and a print stylesheet for **Print / Save as PDF**. Printing expands report details. Revision comparisons can be exported separately.

## Demo mode

The sample contains an original essay and two revisions, with rubric analysis, four teacher comments, before/after excerpts, partial improvements, an unresolved recommendation, a new factual issue, and a regression. Sample source materials are illustrative teaching content.

Demo Mode does **not** analyze uploads. Reports clearly identify sample feedback and show the sample sources actually used, while saved user inputs are labeled separately. Demo revision cycles remain demonstrations; they never imply that user edits were assessed. Start a new live audit to review real work.

## Structure

```text
src/components/  Reusable intake, report, comparison, and dialog components
src/pages/       Home, intake, reports, history, and project timelines
src/services/    Provider abstraction, validation, parsing, storage, exports
src/types/       Typed schemas for reports, materials, and versioned projects
src/data/        Full sample documents, audits, and revision comparisons
src/hooks/       Local project state
 dev/            Development-only Groq proxy
 tests/          Service and opt-in live integration tests
 docs/           Endpoint contract and manual QA checklist
```

## Limitations

Reviews are AI judgments, not guaranteed grades. Evidence checks validate supplied-source references and exact quotations, not external factual truth. Text extraction cannot assess visual formatting. There is no account system, cloud history, background audit queue, or automatic full-assignment rewriting. A live audit requires the configured provider to be reachable and within its account limits.

## Screenshots

Screenshots can be added here after deployment. The built-in **View sample report** provides an interactive product preview.
