import { test, expect } from "vitest";
import { loadEnv } from "vite";
import { runGroqAudit } from "../dev/groqProxy";
import { auditAssignment } from "../src/services/auditService";
import { defaultSettings } from "../src/types/audit";
import type { Source, AuditVersion } from "../src/types/audit";
import { writeFileSync } from "node:fs";
const enabled = process.env.RUN_LIVE_TESTS === "1";
test.skipIf(!enabled)(
  "Groq gpt-oss-20b independently audits and compares a real revision",
  async () => {
    const apiKey = loadEnv("development", process.cwd(), "").GROQ_API_KEY;
    expect(!!apiKey).toBe(true);
    const run = (
      input: Parameters<typeof runGroqAudit>[0],
      key: string,
      signal: AbortSignal,
    ) =>
      process.env.LIVE_AUDIT_URL
        ? auditAssignment(input, signal, {
            endpoint: process.env.LIVE_AUDIT_URL,
            demo: false,
          })
        : runGroqAudit(input, key, signal);
    const source = (
      id: string,
      role: Source["role"],
      text: string,
    ): Source => ({
      id,
      role,
      name: id + ".txt",
      text,
      size: text.length,
      type: "TXT",
      status: "ready",
    });
    const original =
      "School gardens\n\nSchool gardens are useful because they are good. Everyone learns better outside. Students could grow vegetables and learn science. Gardens would make our school better.";
    const materials = [
      source("assignment", "assignment", original),
      source(
        "instructions",
        "instructions",
        "Write a short argument for or against a school garden. Include a clear claim, one supported reason, a counterargument, and a conclusion. Do not claim an outcome is proven without evidence.",
      ),
      source(
        "rubric",
        "rubric",
        "Argument (4): a clear, qualified position. Reasoning (4): explain how evidence supports the claim and address a counterargument. Organization (4): logical progression. Use estimated ranges, not exact grades.",
      ),
      source(
        "feedback",
        "feedback",
        "Explain how gardening supports learning. Address the cost of maintaining a garden.",
      ),
    ];
    const settings = {
      ...defaultSettings,
      educationLevel: "High school" as const,
      depth: "Quick" as const,
    };
    const first = await run(
      { materials, settings, versionNumber: 1 },
      apiKey,
      AbortSignal.timeout(170000),
    );
    expect(first.report.meta.isDemo).toBe(false);
    expect(first.report.priorities.length).toBeGreaterThan(0);
    expect(first.report.teacherFeedback.length).toBeGreaterThan(0);
    writeFileSync(
      "/tmp/assignment-audit-live-first.json",
      JSON.stringify(first, null, 2),
    );
    const version: AuditVersion = {
      id: "live-test-v1",
      versionNumber: 1,
      createdAt: first.report.meta.createdAt,
      materials,
      analyzedSources: materials,
      settings,
      report: first.report,
      checkedItems: [],
    };
    const revision =
      "School gardens\n\nOur school should pilot a small garden as a practical science activity, provided it has a maintenance plan. Growing plants would let students measure growth under different conditions and explain their observations; this is a proposed learning activity, not evidence that all students learn better outdoors.\n\nA counterargument is the cost of soil, water, and summer care. A small pilot would limit initial costs, but the school should first obtain a budget and volunteers for holiday watering. If these resources are unavailable, the project should wait.\n\nA garden could give science lessons a practical context, but its educational value and upkeep costs should be evaluated before expansion.";
    const next = materials.map((s) =>
      s.role === "assignment"
        ? { ...s, text: revision, size: revision.length }
        : s,
    );
    const second = await run(
      {
        materials: next,
        settings,
        versionNumber: 2,
        previousVersion: version,
        originalVersion: version,
      },
      apiKey,
      AbortSignal.timeout(170000),
    );
    expect(second.comparison?.recommendationChanges.length).toBe(
      first.report.priorities.length,
    );
    expect(second.report.meta.versionNumber).toBe(2);
    writeFileSync(
      "/tmp/assignment-audit-live-result.json",
      JSON.stringify({ first, second }, null, 2),
    );
  },
  360000,
);
