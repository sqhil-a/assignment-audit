import type { Plugin } from "vite";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  SourceSchema,
  SettingsSchema,
  VersionSchema,
  ReportSchema,
  ComparisonSchema,
  ResolutionSchema,
} from "../src/types/audit";
import type {
  AuditInput,
  AuditReport,
  RevisionComparison,
  Source,
} from "../src/types/audit";
import {
  authorityGuidance,
  checkUnprovidedRequirements,
} from "../src/services/grounding";
import { AUDIT_INSTRUCTIONS } from "../src/services/instructions";
import {
  validateInput,
  validateReportEvidence,
  validateComparison,
} from "../src/services/validation";
const InputSchema = z.object({
  materials: z.array(SourceSchema).min(1).max(24),
  settings: SettingsSchema,
  versionNumber: z.number().int().positive(),
  previousVersion: VersionSchema.optional(),
  originalVersion: VersionSchema.optional(),
});
const ModelReportSchema = ReportSchema.omit({ meta: true }).extend({
  title: z.string(),
});
const OverviewSchema = ModelReportSchema.pick({
  title: true,
  overall: true,
  summary: true,
  priorities: true,
  rubric: true,
  requirements: true,
  teacherFeedback: true,
});
const DetailSchema = ModelReportSchema.omit({
  title: true,
  overall: true,
  summary: true,
  priorities: true,
  rubric: true,
  requirements: true,
  teacherFeedback: true,
});
const MODEL = "openai/gpt-oss-20b";
function canonicalizeRubricStatuses(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeRubricStatuses);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  const copy = Object.fromEntries(
    Object.entries(object).map(([key, child]) => [
      key,
      canonicalizeRubricStatuses(child),
    ]),
  );
  if (typeof copy.status === "string") {
    copy.status =
      {
        Excellent: "Strong",
        Outstanding: "Strong",
        Good: "Nearly there",
        Developing: "Needs work",
        "Needs improvement": "Needs work",
      }[copy.status] || copy.status;
  }
  return copy;
}
// Strict decoding requires every property to be required, including optional display text.
// Empty strings represent unavailable estimates or quotations; the client treats them as absent.
function strictSchema(value: unknown, sourceIds?: string[]): unknown {
  if (Array.isArray(value)) return value.map((v) => strictSchema(v, sourceIds));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(obj))
      if (
        ![
          "$schema",
          "default",
          "minLength",
          "maxLength",
          "format",
          "minimum",
          "maximum",
          "minItems",
          "maxItems",
        ].includes(key)
      )
        out[key] = strictSchema(v, sourceIds);
    if (out.type === "object" && out.properties) {
      out.required = Object.keys(out.properties as object);
      out.additionalProperties = false;
      if (sourceIds && (out.properties as Record<string, unknown>).sourceId)
        (out.properties as Record<string, unknown>).sourceId = {
          type: "string",
          enum: sourceIds,
        };
    }
    return out;
  }
  return value;
}
export const reportJSONSchema = strictSchema(
  zodToJsonSchema(ModelReportSchema, { $refStrategy: "none" }),
);
export const comparisonJSONSchema = strictSchema(
  zodToJsonSchema(ComparisonSchema, { $refStrategy: "none" }),
);
class ProxyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function pause(ms: number, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
  });
}
async function completion(
  apiKey: string,
  schema: unknown,
  name: string,
  user: unknown,
  signal: AbortSignal,
  maxTokens: number,
): Promise<unknown> {
  let schemaRetries = 0;
  let schemaCorrection = "";
  const fields = Object.keys(
    (schema as { properties: Record<string, unknown> }).properties,
  );
  const contract =
    " The JSON output must include ALL these root fields: " +
    fields.join(", ") +
    ". Every analysis, priority, criterion, requirement, feedback, and section object must include its evidence array, even if empty. Do not omit required properties.";
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          reasoning_effort: "low",
          temperature: 0.1,
          max_completion_tokens: maxTokens,
          messages: [
            {
              role: "system",
              content: AUDIT_INSTRUCTIONS + contract + schemaCorrection,
            },
            { role: "user", content: JSON.stringify(user) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name, strict: true, schema },
          },
        }),
        signal,
      },
    );
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as {
        error?: { code?: string; message?: string; failed_generation?: string };
      } | null;
      const message = detail?.error?.message || "";
      if (process.env.AUDIT_DIAGNOSTICS === "1")
        console.info(
          `[audit:${name}] HTTP ${response.status} ${detail?.error?.code || ""}: ${message.slice(0, 500)}`,
        );
      if (response.status === 429 && attempt < 5) {
        const limit = Number(message.match(/Limit (\d+)/)?.[1]);
        const requested = Number(message.match(/Requested (\d+)/)?.[1]);
        if (limit && requested > limit)
          throw new ProxyError(
            413,
            "Your materials exceed this account’s per-request token allowance.",
          );
        const seconds =
          Number(response.headers.get("retry-after")) ||
          Number(message.match(/try again in ([\d.]+)ms/i)?.[1]) / 1000 ||
          Number(message.match(/try again in ([\d.]+)s/i)?.[1]) ||
          20;
        if (seconds <= 65) {
          await pause(Math.ceil(seconds * 1000) + 1200, signal);
          continue;
        }
      }
      if (
        response.status === 400 &&
        detail?.error?.code === "json_validate_failed" &&
        schemaRetries < 2
      ) {
        schemaRetries++;
        schemaCorrection =
          " Your previous attempt failed validation: " +
          message +
          ". Correct this specific schema violation and include every required field.";
        continue;
      }
      throw new ProxyError(
        response.status === 429
          ? 429
          : response.status === 401
            ? 401
            : response.status === 413
              ? 413
              : 502,
        `The model provider returned HTTP ${response.status}.`,
      );
    }
    const payload = (await response.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: { content?: string };
      }>;
    };
    const choice = payload.choices?.[0];
    if (choice?.finish_reason === "length")
      throw new ProxyError(502, "The model response was cut off.");
    if (!choice?.message?.content)
      throw new ProxyError(502, "The model did not return a report.");
    try {
      return JSON.parse(choice.message.content);
    } catch {
      throw new ProxyError(502, "The model returned invalid JSON.");
    }
  }
  throw new ProxyError(
    429,
    "The model provider is still rate limited. Please retry shortly.",
  );
}

export async function runGroqAudit(
  input: AuditInput,
  apiKey: string,
  signal: AbortSignal,
): Promise<{ report: AuditReport; comparison?: RevisionComparison }> {
  validateInput(input);
  if (JSON.stringify(input).length > 220000)
    throw new ProxyError(413, "The combined revision context is too large.");
  // Current quality is evaluated independently before previous recommendations are introduced.
  const scope = authorityGuidance(
    input.materials,
    input.settings.assignmentType,
  );
  const currentMaterials = input.materials.map(
    ({ id, role, name, text, warning }) => ({ id, role, name, text, warning }),
  );
  let overviewRaw = await completion(
    apiKey,
    strictSchema(
      zodToJsonSchema(OverviewSchema, { $refStrategy: "none" }),
      input.materials.map((s) => s.id),
    ),
    "audit_overview",
    {
      task: "Independently review the current assignment. Cover every supplied rubric criterion, explicit requirement, and meaningful teacher comment. Use the exact original comment wording.",
      scope,
      settings: input.settings,
      materials: currentMaterials,
    },
    signal,
    input.settings.depth === "Quick" ? 3600 : 4800,
  );
  overviewRaw = canonicalizeRubricStatuses(overviewRaw);
  let overview = OverviewSchema.safeParse(overviewRaw);
  if (!overview.success)
    throw new ProxyError(502, "The assessment failed validation.");
  try {
    checkUnprovidedRequirements(overview.data, input.materials);
    if (overview.data.priorities.some((p) => !p.evidence.length))
      throw new Error(
        "Every priority must cite at least one actual source using sourceId, location, and an exact short quote.",
      );
  } catch (error) {
    overviewRaw = await completion(
      apiKey,
      strictSchema(
        zodToJsonSchema(OverviewSchema, { $refStrategy: "none" }),
        input.materials.map((s) => s.id),
      ),
      "audit_overview",
      {
        task: "Correct the review against these supplied materials.",
        scope,
        correction:
          error instanceof Error
            ? error.message
            : "Use only explicit requirements and source-grounded findings.",
        settings: input.settings,
        materials: currentMaterials,
      },
      signal,
      4800,
    );
    overviewRaw = canonicalizeRubricStatuses(overviewRaw);
    overview = OverviewSchema.safeParse(overviewRaw);
    if (!overview.success)
      throw new ProxyError(502, "The assessment failed validation.");
    checkUnprovidedRequirements(overview.data, input.materials);
  }
  const detailRaw = await completion(
    apiKey,
    strictSchema(
      zodToJsonSchema(DetailSchema, { $refStrategy: "none" }),
      input.materials.map((s) => s.id),
    ),
    "audit_detail",
    {
      task: "Review the current assignment in detail. The independent overview below is context for consistent recommendations. For Quick depth keep supporting findings concise. Do not omit required JSON fields. The revision plan and final checklist must follow the priority issues.",
      scope,
      settings: input.settings,
      materials: currentMaterials,
      currentOverview: overview.data,
    },
    signal,
    input.settings.depth === "Quick" ? 3400 : 4800,
  );
  const detail = DetailSchema.safeParse(canonicalizeRubricStatuses(detailRaw));
  if (!detail.success)
    throw new ProxyError(502, "The detailed review failed validation.");
  const raw = { ...overview.data, ...detail.data };
  const parsed = ModelReportSchema.safeParse(raw);
  if (!parsed.success)
    throw new ProxyError(502, "The report failed validation.");
  const { title, ...body } = parsed.data;
  const report: AuditReport = {
    ...body,
    meta: {
      title:
        title || input.materials.find((s) => s.role === "assignment")!.name,
      createdAt: new Date().toISOString(),
      versionNumber: input.versionNumber,
      assignmentType: input.settings.assignmentType,
      depth: input.settings.depth,
      sourceCount: input.materials.length,
      isDemo: false,
    },
  };
  validateReportEvidence(report, input.materials);
  let comparison: RevisionComparison | undefined;
  if (input.previousVersion) {
    const previous = input.previousVersion;
    const beforePassages = previous.analyzedSources
      .filter((s) => s.role === "assignment")
      .flatMap((s) =>
        s.text
          .split(/\n\s*\n/)
          .map((text) => text.trim())
          .filter(Boolean),
      )
      .map((text, i) => ({ id: `before-${i}`, text }));
    const afterPassages = input.materials
      .filter((s) => s.role === "assignment")
      .flatMap((s) =>
        s.text
          .split(/\n\s*\n/)
          .map((text) => text.trim())
          .filter(Boolean),
      )
      .map((text, i) => ({ id: `after-${i}`, text }));
    const passageSchema = z.object({
      title: z.string(),
      beforeId: z.enum(
        beforePassages.map((p) => p.id) as [string, ...string[]],
      ),
      afterId: z.enum(afterPassages.map((p) => p.id) as [string, ...string[]]),
      audit: z.string(),
    });
    const changesSchema = z.object(
      Object.fromEntries(
        previous.report.priorities.map((p) => [
          p.id,
          ResolutionSchema.omit({
            recommendationId: true,
            title: true,
            previousIssue: true,
          }),
        ]),
      ),
    );
    const modelComparisonSchema = ComparisonSchema.omit({
      recommendationChanges: true,
      fromVersion: true,
      toVersion: true,
      resolvedCount: true,
      improvedCount: true,
      unresolvedCount: true,
      regressionsCount: true,
      newIssuesCount: true,
      rubricChanges: true,
      teacherFeedbackChanges: true,
      keyComparisons: true,
    }).extend({
      recommendationChanges: changesSchema,
      keyComparisons: z.array(passageSchema),
    });
    const dynamicSchema = strictSchema(
      zodToJsonSchema(modelComparisonSchema, { $refStrategy: "none" }),
      input.materials.map((s) => s.id),
    );
    const rawComparison = await completion(
      apiKey,
      dynamicSchema,
      "revision_comparison",
      {
        task: "Evaluate revision effectiveness, using this independently created current report. The recommendationChanges object must contain a result for every exact previous priority ID required in the schema. Use current source IDs for evidence references. For keyComparisons select exact beforeId and afterId from the supplied passage lists; the application will insert their original text. Use empty strings for evidence.quote in this comparison because passages supply the quoted evidence. Keep comparisons concise.",
        fromVersion: previous.versionNumber,
        toVersion: input.versionNumber,
        originalAssignment:
          input.originalVersion?.id !== previous.id
            ? input.originalVersion?.analyzedSources
                .filter((s) => s.role === "assignment")
                .map(({ id, text }) => ({ id, text }))
            : undefined,
        // Passage lists already contain the full previous and revised assignments.
        // Do not send those drafts again inside source snapshots.
        currentMaterials: currentMaterials.map((s) =>
          s.role === "assignment" ? { ...s, text: undefined } : s,
        ),
        beforePassages,
        afterPassages,
        previousReport: previous.report,
        originalAuditReport:
          input.originalVersion?.id !== previous.id
            ? input.originalVersion?.report
            : undefined,
        currentReport: {
          summary: report.summary,
          overall: report.overall,
          priorities: report.priorities,
        },
      },
      signal,
      3600,
    );
    const modelResult = modelComparisonSchema.safeParse(rawComparison);
    if (!modelResult.success)
      throw new ProxyError(502, "The revision comparison failed validation.");
    const progression = deriveProgress(
      previous.report,
      report,
      previous.materials,
      input.materials,
    );
    const transformed = {
      ...modelResult.data,
      keyComparisons: modelResult.data.keyComparisons.map((p, i) => ({
        id: `comparison-${i + 1}`,
        title: p.title,
        before: beforePassages.find((x) => x.id === p.beforeId)!.text,
        after: afterPassages.find((x) => x.id === p.afterId)!.text,
        audit: p.audit,
      })),
      ...progression,
      fromVersion: previous.versionNumber,
      toVersion: input.versionNumber,
      resolvedCount: 0,
      improvedCount: 0,
      unresolvedCount: 0,
      regressionsCount: 0,
      newIssuesCount: 0,
      recommendationChanges: previous.report.priorities.map((p) => ({
        ...modelResult.data.recommendationChanges[p.id],
        recommendationId: p.id,
        title: p.title,
        previousIssue: p.detail,
      })),
    };
    const checked = ComparisonSchema.safeParse(transformed);
    if (!checked.success)
      throw new ProxyError(502, "The revision comparison failed validation.");
    comparison = checked.data;
    validateComparison(comparison, input, report);
  }
  return { report, comparison };
}
export function groqDevProxy(apiKey: string): Plugin {
  return {
    name: "assignment-audit-local-groq",
    apply: "serve",
    configureServer(server) {
      let active = 0;
      server.middlewares.use("/api/health", async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        const host = req.headers.host || "";
        const origin = req.headers.origin;
        if (
          !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ||
          (origin && origin !== `http://${host}`)
        ) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: "Local access only." }));
          return;
        }
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Allow", "GET");
          res.end(JSON.stringify({ error: "Use GET." }));
          return;
        }
        if (!apiKey) {
          res.statusCode = 503;
          res.end(
            JSON.stringify({
              error: "Set GROQ_API_KEY in .env.local and restart the app.",
            }),
          );
          return;
        }
        try {
          const response = await fetch(
            `https://api.groq.com/openai/v1/models/${MODEL}`,
            {
              headers: { Authorization: `Bearer ${apiKey}` },
              signal: AbortSignal.timeout(10000),
            },
          );
          if (!response.ok) {
            res.statusCode = response.status === 401 ? 401 : 502;
            res.end(
              JSON.stringify({
                error:
                  response.status === 401
                    ? "Groq rejected the API key. Update .env.local and restart the app."
                    : "Groq is unavailable. Try again shortly.",
              }),
            );
            return;
          }
          res.end(JSON.stringify({ connected: true, model: MODEL }));
        } catch {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              error: "Could not reach Groq. Check your connection and retry.",
            }),
          );
        }
      });
      server.middlewares.use("/api/audit", async (req, res, next) => {
        if (req.url !== "/" && req.url !== "") {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        const fail = (status: number, message: string) => {
          res.statusCode = status;
          res.end(JSON.stringify({ error: message }));
        };
        const host = req.headers.host || "";
        const origin = req.headers.origin;
        if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
          fail(403, "Local access only.");
          return;
        }
        if (origin && origin !== `http://${host}`) {
          fail(403, "Cross-origin requests are not permitted.");
          return;
        }
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          fail(405, "Use POST.");
          return;
        }
        if (!apiKey) {
          fail(503, "Set GROQ_API_KEY in .env.local.");
          return;
        }
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          fail(415, "Use application/json.");
          return;
        }
        if (active >= 2) {
          fail(429, "An audit is already in progress.");
          return;
        }
        const abort = new AbortController();
        const timeout = setTimeout(() => abort.abort(), 170000);
        res.on("close", () => {
          if (!res.writableEnded) abort.abort();
        });
        active++;
        try {
          let body = "";
          let bytes = 0;
          for await (const chunk of req) {
            bytes += Buffer.byteLength(chunk);
            if (bytes > 2500000)
              throw new ProxyError(413, "Request too large.");
            body += chunk.toString();
          }
          let data: unknown;
          try {
            data = JSON.parse(body);
          } catch {
            throw new ProxyError(400, "Malformed request.");
          }
          const envelope = z
            .object({ schemaVersion: z.literal(1), input: InputSchema })
            .safeParse(data);
          if (!envelope.success)
            throw new ProxyError(400, "Invalid audit input.");
          const output = await runGroqAudit(
            envelope.data.input,
            apiKey,
            abort.signal,
          );
          if (!res.destroyed) res.end(JSON.stringify(output));
        } catch (error) {
          if (!res.destroyed) {
            const status =
              error instanceof ProxyError
                ? error.status
                : abort.signal.aborted
                  ? 504
                  : 502;
            fail(
              status,
              error instanceof ProxyError
                ? error.message
                : "The audit could not be completed. Please retry.",
            );
          }
        } finally {
          active--;
          clearTimeout(timeout);
        }
      });
    },
  };
}

export function deriveProgress(
  previous: AuditReport,
  current: AuditReport,
  beforeSources: Source[],
  afterSources: Source[],
) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9]/g, "");
  const rubricChanged =
    beforeSources
      .filter((s) => s.role === "rubric")
      .map((s) => s.text)
      .join("\n") !==
    afterSources
      .filter((s) => s.role === "rubric")
      .map((s) => s.text)
      .join("\n");
  const names = Array.from(
    new Set(
      [...previous.rubric, ...current.rubric].map((r) => normalize(r.name)),
    ),
  );
  const rubricChanges = names.map((name) => {
    const before = previous.rubric.find((r) => normalize(r.name) === name);
    const after = current.rubric.find((r) => normalize(r.name) === name);
    return {
      criterion: after?.name || before!.name,
      previous: before?.estimate || "Not estimated",
      current: after?.estimate || "Not estimated",
      change: rubricChanged
        ? "Rubric changed; not directly comparable"
        : !before
          ? "Criterion added"
          : !after
            ? "Criterion not assessed"
            : before.estimate === after.estimate
              ? "Similar estimate"
              : "Estimate changed",
    };
  });
  const comments = Array.from(
    new Set(
      [...previous.teacherFeedback, ...current.teacherFeedback].map(
        (f) => f.comment,
      ),
    ),
  );
  const teacherFeedbackChanges = comments.map((comment) => {
    const before = previous.teacherFeedback.find((f) => f.comment === comment);
    const after = current.teacherFeedback.find((f) => f.comment === comment);
    return {
      comment,
      previous: before?.status || "Not included",
      current: after?.status || "Not included",
      explanation:
        after?.assessment ||
        after?.nextStep ||
        "This comment was not included in the current review.",
    };
  });
  return { rubricChanges, teacherFeedbackChanges };
}
