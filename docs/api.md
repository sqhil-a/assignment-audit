# Audit endpoint contract

Set `VITE_AUDIT_API_URL` to an HTTPS endpoint. The browser sends only extracted text, metadata, settings, and preceding versions, never original binary files or provider keys.

```ts
POST /audit
Content-Type: application/json

{
  schemaVersion: 1,
  input: {
    materials: Source[],
    settings: AuditSettings,
    versionNumber: number,
    previousVersion?: AuditVersion,
    originalVersion?: AuditVersion
  }
}
```

The response must be JSON:

```ts
{
  report: AuditReport,
  comparison?: RevisionComparison // Required when previousVersion exists
}
```

`Source`, `AuditReport`, `AuditVersion`, and `RevisionComparison` have executable Zod schemas in `src/types/audit.ts`. Keep a server implementation aligned with these schemas. Use the `AUDIT_INSTRUCTIONS` constant to preserve source grounding and student ownership.

## Required semantics

- Every evidence reference uses an actual input `sourceId`. A quoted excerpt must be present in that source. Locations use actual headings or PDF page markers; they must not invent paragraph/page numbers.
- Teacher comments are exact excerpts of supplied teacher feedback. Explain the status in `assessment`, with evidence and a next step.
- No rubric means no criterion scoring or overall numeric estimate. Use an empty estimate string in strict model output for unavailable estimates; the browser removes unsupported scoring.
- The browser owns date, version number, source count, analysis mode, assignment type, and depth. The provider supplies the report title and analysis.
- Comparison `recommendationChanges` contains every prior priority ID exactly once. Before/after excerpts must exist in the respective assignments. New issues and regressions are independently assessed. Counts are recomputed by the validator.
- Missing optional collections normalize to empty arrays. Missing core content or an invalid comparison fails the audit; the previous report is preserved. Do not return partial successes as full reports.

## Groq reference implementation

The development proxy in `dev/groqProxy.ts` uses `openai/gpt-oss-20b` with strict `json_schema` structured output. Schemas are derived from Zod. Current quality is audited in two separate structured stages before any previous report is introduced for comparison. Before/after text is resolved from actual source passage IDs; rubric and teacher-feedback progress are derived from the verified reports. There are no browser-held credentials.

`GROQ_API_KEY` is loaded from `.env.local` by Vite. Only a boolean indicating development availability is bundled. The proxy accepts same-origin JSON POSTs on loopback hosts, limits body size and concurrency, supports cancellation, and times out stalled requests. It is a development convenience, not a production hosting backend.

See [Groq structured outputs](https://console.groq.com/docs/structured-outputs).

## Errors

Use standard HTTP status codes. The client gives user-facing messages for authentication failure (401/403), oversized input (413), rate limits (429), network errors, timeouts, malformed JSON, invalid reports, and missing/invalid comparisons. It does not display raw provider errors or stack traces. A failed request can be retried with the same staged materials.

The browser cancels after 180 seconds. A server should stop work when the request disconnects. External endpoints need CORS for the exact frontend origin and must handle preflight requests. Credentials are omitted by the current frontend; use server-side authorization suited to the deployment or extend the service intentionally.
