import { checkUnprovidedRequirements } from "./grounding";
import { ComparisonSchema, ReportSchema } from "../types/audit";
import type {
  AuditInput,
  AuditResult,
  AuditReport,
  Evidence,
  Source,
  RevisionComparison,
} from "../types/audit";
import { MAX_TOTAL_TEXT, validateText } from "./fileParser";
export function validateInput(input: AuditInput) {
  if (!input.materials.some((s) => s.role === "assignment" && s.text.trim()))
    throw new Error(
      "Your assignment is missing. Upload a document or paste its text.",
    );
  if (input.materials.some((s) => s.status !== "ready"))
    throw new Error(
      "Your materials are not all ready. Remove failed files or wait for reading to finish.",
    );
  if (input.materials.length > 24)
    throw new Error("Too many materials. Add no more than 24 documents.");
  input.materials.forEach((s) => validateText(s.text));
  if (input.materials.reduce((n, s) => n + s.text.length, 0) > MAX_TOTAL_TEXT)
    throw new Error(
      "Your materials exceed the 600,000-character limit. Keep only the relevant sections.",
    );
  if (input.versionNumber > 1 && !input.previousVersion)
    throw new Error(
      "Revision context is missing. Open the latest saved version and start again.",
    );
  if (
    input.previousVersion &&
    input.versionNumber !== input.previousVersion.versionNumber + 1
  )
    throw new Error(
      "Revision numbers are out of sequence. Reopen the latest version.",
    );
}
function visitEvidence(value: unknown, callback: (e: Evidence) => void) {
  if (Array.isArray(value)) value.forEach((x) => visitEvidence(x, callback));
  else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.sourceId === "string" && typeof obj.location === "string")
      callback(obj as Evidence);
    else Object.values(obj).forEach((x) => visitEvidence(x, callback));
  }
}
const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
export function validateReportEvidence(report: AuditReport, sources: Source[]) {
  checkUnprovidedRequirements(report, sources);
  if (report.priorities.some((p) => !p.evidence.length))
    throw new Error(
      "The audit did not ground every priority in your sources. Please retry.",
    );
  visitEvidence(report, (e) => {
    const source = sources.find((s) => s.id === e.sourceId);
    if (!source)
      throw new Error(
        "The audit referenced an unknown source. Please retry the audit.",
      );
    if (/\b(?:page|paragraph)\s*\d/i.test(e.location) && !e.quote) {
      const page = e.location.match(/page\s*(\d+)/i)?.[1];
      if (!page || !source.text.includes(`[Page ${page}]`))
        e.location = "Extracted text";
    }
    if (e.quote && /\b(?:page|paragraph)\s*\d/i.test(e.location)) {
      const normalized = normalize(source.text);
      const offset = normalized.indexOf(normalize(e.quote));
      const page = [
        ...normalized.slice(0, offset).matchAll(/\[Page (\d+)\]/g),
      ].at(-1)?.[1];
      const block = source.text
        .split(/\n\s*\n/)
        .findIndex((t) => normalize(t).includes(normalize(e.quote!)));
      e.location = page
        ? `Page ${page}`
        : block >= 0
          ? `Text block ${block + 1}`
          : "Quoted excerpt";
    }
    if (e.quote && !normalize(source.text).includes(normalize(e.quote)))
      throw new Error(
        "The audit included a quotation that could not be verified. Please retry.",
      );
  });
  for (const key of [
    "priorities",
    "rubric",
    "requirements",
    "teacherFeedback",
    "sections",
    "evidenceAnalysis",
    "writingAnalysis",
    "strengths",
    "gaps",
    "recommendedEdits",
    "finalChecklist",
  ] as const) {
    const ids = report[key].map((x) => x.id);
    if (new Set(ids).size !== ids.length)
      throw new Error(
        "The audit returned duplicate item identifiers. Please retry.",
      );
  }
  const feedback = sources
    .filter((s) => s.role === "feedback")
    .map((s) => normalize(s.text))
    .join("\n");
  if (
    report.teacherFeedback.some((f) => !feedback.includes(normalize(f.comment)))
  )
    throw new Error(
      "The audit included a teacher comment that could not be verified. Please retry.",
    );
  if (!sources.some((s) => s.role === "rubric") || !report.rubric.length) {
    report.rubric = [];
    delete report.overall.estimate;
    report.overall.uncertainty =
      "No rubric was supplied. Criterion-level scoring cannot be estimated reliably.";
    if (!sources.some((s) => s.role === "instructions"))
      report.overall.uncertainty +=
        " Assignment instructions were not supplied, so requirement coverage cannot be verified.";
  }
}
export function validateComparison(
  comparison: RevisionComparison,
  input: AuditInput,
  report: AuditReport,
) {
  const previous = input.previousVersion;
  if (
    !previous ||
    comparison.fromVersion !== previous.versionNumber ||
    comparison.toVersion !== input.versionNumber
  )
    throw new Error(
      "Revision comparison did not match the requested versions. Please retry.",
    );
  const ids = comparison.recommendationChanges.map((c) => c.recommendationId);
  if (
    new Set(ids).size !== ids.length ||
    ids.length !== previous.report.priorities.length ||
    previous.report.priorities.some((p) => !ids.includes(p.id))
  )
    throw new Error(
      "Revision comparison did not account for every previous recommendation. Please retry.",
    );
  const before = normalize(
    previous.analyzedSources
      .filter((s) => s.role === "assignment")
      .map((s) => s.text)
      .join("\n"),
  );
  const after = normalize(
    input.materials
      .filter((s) => s.role === "assignment")
      .map((s) => s.text)
      .join("\n"),
  );
  for (const c of comparison.keyComparisons)
    if (
      !before.includes(normalize(c.before)) ||
      !after.includes(normalize(c.after))
    )
      throw new Error(
        "Revision excerpts could not be verified against both assignments. Please retry.",
      );
  visitEvidence(comparison, (e) => {
    const source = input.materials.find((s) => s.id === e.sourceId);
    if (
      !source ||
      (e.quote && !normalize(source.text).includes(normalize(e.quote)))
    )
      throw new Error("Revision evidence could not be verified. Please retry.");
  });
  comparison.resolvedCount = comparison.recommendationChanges.filter(
    (c) => c.status === "Resolved",
  ).length;
  comparison.improvedCount = comparison.recommendationChanges.filter((c) =>
    ["Improved", "Partially addressed"].includes(c.status),
  ).length;
  comparison.unresolvedCount =
    comparison.recommendationChanges.length -
    comparison.resolvedCount -
    comparison.improvedCount;
  comparison.regressionsCount = comparison.regressions.length;
  comparison.newIssuesCount = comparison.newIssues.length;
  if (!report.rubric.length) comparison.rubricChanges = [];
}
export function parseAuditResponse(
  data: unknown,
  input: AuditInput,
): AuditResult {
  if (!data || typeof data !== "object")
    throw new Error(
      "The audit service returned an invalid report. Please retry.",
    );
  const raw = data as Record<string, unknown>;
  const parsed = ReportSchema.safeParse(raw.report);
  if (!parsed.success)
    throw new Error(
      "The audit service returned an incomplete or malformed report. Please retry.",
    );
  const report = parsed.data;
  report.meta = {
    ...report.meta,
    createdAt: new Date().toISOString(),
    versionNumber: input.versionNumber,
    assignmentType: input.settings.assignmentType,
    depth: input.settings.depth,
    sourceCount: input.materials.length,
    isDemo: false,
  };
  validateReportEvidence(report, input.materials);
  let comparison: RevisionComparison | undefined;
  if (input.previousVersion) {
    const result = ComparisonSchema.safeParse(raw.comparison);
    if (!result.success)
      throw new Error(
        "Revision comparison was missing or malformed. Your previous report is safe. Please retry.",
      );
    comparison = result.data;
    validateComparison(comparison, input, report);
  }
  return { report, comparison, analyzedSources: input.materials };
}
