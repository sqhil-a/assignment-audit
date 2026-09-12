import { describe, it, expect, vi, afterEach } from "vitest";
import { createSampleProject, demoResult } from "../src/data/sampleRevision";
import { sampleMaterials } from "../src/data/sampleMaterials";
import { sampleReport } from "../src/data/sampleAudit";
import {
  ProjectSchema,
  ReportSchema,
  ComparisonSchema,
  defaultSettings,
} from "../src/types/audit";
import type { AuditInput } from "../src/types/audit";
import {
  validateInput,
  parseAuditResponse,
  validateReportEvidence,
  validateComparison,
} from "../src/services/validation";
import { auditAssignment } from "../src/services/auditService";
import {
  readProjects,
  persistProjects,
  STORAGE_KEY,
} from "../src/services/storage";
import {
  validateFile,
  validateText,
  parseFile,
  MAX_FILE_BYTES,
} from "../src/services/fileParser";
const input = (): AuditInput => ({
  materials: sampleMaterials(),
  settings: defaultSettings,
  versionNumber: 1,
});
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  key(i: number) {
    return [...this.map.keys()][i] || null;
  }
}
afterEach(() => vi.restoreAllMocks());
describe("sample reports and revision continuity", () => {
  it("provides three fully typed reports with traceable source quotations", () => {
    const p = createSampleProject();
    expect(ProjectSchema.safeParse(p).success).toBe(true);
    for (const v of p.versions) {
      expect(ReportSchema.safeParse(v.report).success).toBe(true);
      validateReportEvidence(v.report, v.analyzedSources);
      if (v.comparison)
        expect(ComparisonSchema.safeParse(v.comparison).success).toBe(true);
    }
  });
  it("accounts for all previous priorities in adjacent comparisons", () => {
    const p = createSampleProject();
    for (let i = 1; i < p.versions.length; i++) {
      const v = p.versions[i];
      validateComparison(
        v.comparison!,
        {
          materials: v.analyzedSources,
          settings: v.settings,
          versionNumber: v.versionNumber,
          previousVersion: p.versions[i - 1],
        },
        v.report,
      );
    }
  });
  it("supports later demo cycles without inventing further improvement", () => {
    const p = createSampleProject();
    const result = demoResult({
      ...input(),
      versionNumber: 4,
      previousVersion: p.versions[2],
    });
    expect(result.comparison?.overallChange).toBe(
      "No further change in the sample",
    );
    expect(result.comparison?.resolvedCount).toBe(0);
  });
});
describe("input and file handling", () => {
  it("rejects missing assignment, unreadable materials, and missing revision context", () => {
    expect(() => validateInput({ ...input(), materials: [] })).toThrow(
      "missing",
    );
    expect(() =>
      validateInput({
        ...input(),
        materials: input().materials.map((s) => ({
          ...s,
          status: "failed" as const,
        })),
      }),
    ).toThrow("not all ready");
    expect(() => validateInput({ ...input(), versionNumber: 2 })).toThrow(
      "context",
    );
  });
  it("rejects invalid, oversized, empty and overlong content", () => {
    expect(() => validateFile({ name: "x.exe", size: 5 })).toThrow("Choose");
    expect(() =>
      validateFile({ name: "x.pdf", size: MAX_FILE_BYTES + 1 }),
    ).toThrow("too large");
    expect(() => validateFile({ name: "x.txt", size: 0 })).toThrow("empty");
    expect(() => validateText("  ")).toThrow("No readable");
    expect(() => validateText("x".repeat(160001))).toThrow("exceeds");
  });
  it("extracts an uploaded TXT document and preserves role and metadata", async () => {
    const file = new File(
      ["Thesis\n\nEvidence supports this argument."],
      "assignment.txt",
      { type: "text/plain" },
    );
    const parsed = await parseFile(file, "assignment", "text-test");
    expect(parsed.text).toContain("Evidence supports");
    expect(parsed.status).toBe("ready");
    expect(parsed.name).toBe("assignment.txt");
  });
  it("extracts Markdown without pretending to analyze it", async () => {
    const parsed = await parseFile(
      new File(["# Findings\nA claim."], "notes.md"),
      "context",
      "md-test",
    );
    expect(parsed.text).toBe("# Findings\nA claim.");
    expect(parsed.role).toBe("context");
  });
});
describe("untrusted API responses", () => {
  it("rejects malformed reports", () =>
    expect(() =>
      parseAuditResponse({ report: { summary: "bad" } }, input()),
    ).toThrow("malformed"));
  it("fills optional report collections and owns authoritative metadata", () => {
    const raw = { ...sampleReport(), writingAnalysis: undefined };
    const parsed = parseAuditResponse({ report: raw }, input());
    expect(parsed.report.writingAnalysis).toEqual([]);
    expect(parsed.report.meta.isDemo).toBe(false);
  });
  it("rejects invented source IDs, quotations, teacher comments, and duplicate IDs", () => {
    for (const mutate of [
      (r: ReturnType<typeof sampleReport>) => {
        r.priorities[0].evidence[0].sourceId = "invented";
      },
      (r: ReturnType<typeof sampleReport>) => {
        r.priorities[0].evidence[0].quote = "A fake quotation.";
      },
      (r: ReturnType<typeof sampleReport>) => {
        r.teacherFeedback[0].comment = "Invented feedback";
      },
      (r: ReturnType<typeof sampleReport>) => {
        r.finalChecklist[1].id = r.finalChecklist[0].id;
      },
    ]) {
      const r = sampleReport();
      mutate(r);
      expect(() => validateReportEvidence(r, sampleMaterials())).toThrow();
    }
  });
  it("removes unsupported scoring without a rubric", () => {
    const r = sampleReport();
    r.priorities = [];
    r.rubric = [];
    r.recommendedEdits = [];
    const sources = sampleMaterials().filter((s) => s.role !== "rubric");
    validateReportEvidence(r, sources);
    expect(r.overall.estimate).toBeUndefined();
    expect(r.overall.uncertainty).toContain("No rubric");
  });
  it("rejects missing comparison and wrong comparison versions", () => {
    const p = createSampleProject();
    const revision = {
      ...input(),
      materials: p.versions[1].analyzedSources,
      versionNumber: 2,
      previousVersion: p.versions[0],
    };
    expect(() =>
      parseAuditResponse({ report: p.versions[1].report }, revision),
    ).toThrow("comparison");
    const c = structuredClone(p.versions[1].comparison!);
    c.toVersion = 9;
    expect(() => validateComparison(c, revision, p.versions[1].report)).toThrow(
      "versions",
    );
  });
  it("rejects missing previous recommendations and fabricated before-after excerpts", () => {
    const p = createSampleProject();
    const revision = {
      ...input(),
      materials: p.versions[1].analyzedSources,
      versionNumber: 2,
      previousVersion: p.versions[0],
    };
    const c = structuredClone(p.versions[1].comparison!);
    c.recommendationChanges.pop();
    expect(() => validateComparison(c, revision, p.versions[1].report)).toThrow(
      "every previous",
    );
    const other = structuredClone(p.versions[1].comparison!);
    other.keyComparisons[0].after = "Fabricated passage";
    expect(() =>
      validateComparison(other, revision, p.versions[1].report),
    ).toThrow("excerpts");
  });
  it("handles network failures, HTTP failures, and malformed JSON without demo fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );
    await expect(
      auditAssignment(input(), undefined, {
        demo: false,
        endpoint: "https://test.invalid/audit",
      }),
    ).rejects.toThrow("Network");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("bad", { status: 429 })),
    );
    await expect(
      auditAssignment(input(), undefined, {
        demo: false,
        endpoint: "https://test.invalid/audit",
      }),
    ).rejects.toThrow("rate limited");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
    );
    await expect(
      auditAssignment(input(), undefined, {
        demo: false,
        endpoint: "https://test.invalid/audit",
      }),
    ).rejects.toThrow("malformed JSON");
    vi.unstubAllGlobals();
  });
  it("cancels a demo before it can create a result", async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(
      auditAssignment(input(), abort.signal, { demo: true }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
describe("local project persistence", () => {
  it("retains every version, context, comparison, and checked item after reload", () => {
    const storage = new MemoryStorage();
    const p = createSampleProject();
    p.versions[1].checkedItems = ["c-analysis"];
    expect(persistProjects([p], storage)).toBe("");
    const loaded = readProjects(storage);
    expect(loaded.projects).toEqual([p]);
    expect(loaded.projects[0].versions).toHaveLength(3);
  });
  it("preserves corrupt data instead of silently deleting it", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "corrupt");
    expect(readProjects(storage).warning).toContain("retained");
    expect(storage.getItem(STORAGE_KEY)).toBe("corrupt");
  });
  it("reports quota failure without destroying existing history", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, projects: [] }),
    );
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(persistProjects([createSampleProject()], storage)).toContain(
      "full or unavailable",
    );
    expect(readProjects(storage).projects).toEqual([]);
  });
});

describe("grounding when expectations are absent", () => {
  it("rejects invented mandatory components in an assignment-only review", () => {
    const r = sampleReport();
    r.overall.evaluation = "A budget is a required component.";
    expect(() => validateReportEvidence(r, [sampleMaterials()[0]])).toThrow(
      "inferred mandatory",
    );
  });
  it("requires every priority to point to supplied evidence", () => {
    const r = sampleReport();
    r.priorities[0].evidence = [];
    expect(() => validateReportEvidence(r, sampleMaterials())).toThrow(
      "ground every priority",
    );
  });
  it("does not display invented paragraph numbers without verifiable evidence", () => {
    const r = sampleReport();
    r.priorities[0].evidence = [
      { sourceId: "sample-assignment", location: "Paragraph 99" },
    ];
    validateReportEvidence(r, sampleMaterials());
    expect(r.priorities[0].evidence[0].location).toBe("Extracted text");
  });
});
