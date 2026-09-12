import { describe, it, expect, vi, afterEach } from "vitest";
import { deriveProgress, runGroqAudit } from "../dev/groqProxy";
import { createSampleProject } from "../src/data/sampleRevision";
import { sampleReport } from "../src/data/sampleAudit";
import { sampleMaterials } from "../src/data/sampleMaterials";
import { defaultSettings } from "../src/types/audit";
const response = (data: unknown) =>
  new Response(
    JSON.stringify({
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify(data) } },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("Groq proxy contract", () => {
  it("performs two structured current-work stages with the specified model", async () => {
    const report = sampleReport();
    const data = { ...report, title: report.meta.title };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(data))
      .mockResolvedValueOnce(response(data));
    vi.stubGlobal("fetch", fetchMock);
    const result = await runGroqAudit(
      {
        materials: sampleMaterials(),
        settings: defaultSettings,
        versionNumber: 1,
      },
      "test-key",
      AbortSignal.timeout(10000),
    );
    expect(result.report.meta.isDemo).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe(
      "openai/gpt-oss-20b",
    );
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).response_format.json_schema
        .strict,
    ).toBe(true);
  });
  it("derives rubric and teacher progress from the original reports", () => {
    const project = createSampleProject();
    const result = deriveProgress(
      project.versions[0].report,
      project.versions[1].report,
      sampleMaterials(),
      sampleMaterials(2),
    );
    expect(result.teacherFeedbackChanges).toHaveLength(4);
    expect(result.teacherFeedbackChanges[1].previous).toBe("Not addressed");
    expect(result.teacherFeedbackChanges[1].current).toBe("Addressed");
    expect(result.rubricChanges[0].previous).toBe("5–6 / 8");
  });
  it("flags rubric edits as incomparable instead of claiming numerical progress", () => {
    const before = sampleMaterials();
    const after = sampleMaterials(2).map((s) =>
      s.role === "rubric" ? { ...s, text: "A different rubric" } : s,
    );
    const result = deriveProgress(
      sampleReport(),
      sampleReport(2),
      before,
      after,
    );
    expect(
      result.rubricChanges.every((c) =>
        c.change.includes("not directly comparable"),
      ),
    ).toBe(true);
  });
  it("resolves selected before/after IDs to actual saved passages", async () => {
    const project = createSampleProject();
    const current = project.versions[1];
    const data = { ...current.report, title: current.report.meta.title };
    const c = current.comparison!;
    const modelComparison = {
      ...c,
      recommendationChanges: Object.fromEntries(
        c.recommendationChanges.map((r) => [r.recommendationId, r]),
      ),
      keyComparisons: [
        {
          title: "Thesis",
          beforeId: "before-1",
          afterId: "after-1",
          audit: "The position becomes qualified.",
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response(data))
        .mockResolvedValueOnce(response(data))
        .mockResolvedValueOnce(response(modelComparison)),
    );
    const result = await runGroqAudit(
      {
        materials: current.materials,
        settings: defaultSettings,
        versionNumber: 2,
        previousVersion: project.versions[0],
        originalVersion: project.versions[0],
      },
      "test-key",
      AbortSignal.timeout(10000),
    );
    expect(result.comparison?.keyComparisons[0].before).toBe(
      project.versions[0].materials[0].text.split(/\n\s*\n/)[1],
    );
    expect(result.comparison?.recommendationChanges).toHaveLength(4);
    expect(result.comparison?.resolvedCount).toBe(2);
  });
  it("canonicalizes common rubric status synonyms from the model", async () => {
    const report = sampleReport();
    const data = {
      ...report,
      title: report.meta.title,
      rubric: report.rubric.map((item, i) => ({
        ...item,
        status: i === 0 ? "Developing" : item.status,
      })),
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(data))
      .mockResolvedValueOnce(response(data));
    vi.stubGlobal("fetch", fetchMock);
    const result = await runGroqAudit(
      {
        materials: sampleMaterials(),
        settings: defaultSettings,
        versionNumber: 1,
      },
      "test-key",
      AbortSignal.timeout(10000),
    );
    expect(result.report.rubric[0].status).toBe("Needs work");
  });
});
