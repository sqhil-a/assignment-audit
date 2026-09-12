import type {
  AuditInput,
  AuditResult,
  Project,
  RevisionComparison,
} from "../types/audit";
import { defaultSettings } from "../types/audit";
import { sampleReport, sampleEvidence as ev } from "./sampleAudit";
import { sampleMaterials } from "./sampleMaterials";
export function sampleComparison(fromVersion: number): RevisionComparison {
  const first = fromVersion === 1;
  const next = fromVersion + 1;
  const previous = sampleReport(fromVersion);
  const current = sampleReport(next);
  const assignments = [
    sampleMaterials(fromVersion)[0].text,
    sampleMaterials(next)[0].text,
  ];
  const changes: RevisionComparison["recommendationChanges"] = first
    ? [
        {
          recommendationId: "p-thesis",
          title: "Qualify the central judgment",
          previousIssue: previous.priorities[0].detail,
          status: "Resolved",
          whatChanged:
            "The thesis now distinguishes later earning opportunities from early costs and makes regulation part of the explanation.",
          why: "The judgment can accommodate the mixed evidence instead of contradicting it.",
          evidence: [ev("assignment", "Introduction")],
        },
        {
          recommendationId: "p-analysis",
          title: "Make the evidence prove the argument",
          previousIssue: previous.priorities[1].detail,
          status: "Partially addressed",
          whatChanged:
            "The economic paragraph now weighs income against health. The urban paragraph remains largely descriptive.",
          why: "The evaluation is stronger, but it is not yet sustained throughout the response.",
          evidence: [
            ev("assignment", "Economic change"),
            ev("assignment", "Urban life"),
          ],
        },
        {
          recommendationId: "p-counter",
          title: "Evaluate an alternative interpretation",
          previousIssue: previous.priorities[2].detail,
          status: "Resolved",
          whatChanged:
            "The factory paragraph presents an income-security argument and evaluates its limits using health costs.",
          why: "This addresses the missing requirement and the teacher’s request for another interpretation.",
          evidence: [ev("assignment", "Working conditions")],
        },
        {
          recommendationId: "p-citations",
          title: "Make every borrowed claim traceable",
          previousIssue: previous.priorities[3].detail,
          status: "Unchanged",
          whatChanged:
            "Some attributions were added, but the urban-life claims still lack references. The original requirement for complete traceability remains unresolved.",
          why: "The reader still cannot reliably locate the evidence behind every major claim.",
          evidence: [ev("assignment", "Urban life")],
        },
      ]
    : previous.priorities.map((p) => ({
        recommendationId: p.id,
        title: p.title,
        previousIssue: p.detail,
        status:
          fromVersion === 2 && ["p-new", "p-significance"].includes(p.id)
            ? ("Resolved" as const)
            : ("Unchanged" as const),
        whatChanged:
          fromVersion === 2 && p.id === "p-new"
            ? "The unsupported elimination claim has been replaced with a limited claim grounded in the notes."
            : fromVersion === 2 && p.id === "p-significance"
              ? "The final sentence restores a reflection on the limits of using output to measure progress."
              : "The sample continues to show this remaining area for improvement.",
        why:
          fromVersion === 2 && ["p-new", "p-significance"].includes(p.id)
            ? "The change restores evidence-grounded reasoning and requirement coverage."
            : "Further revision is still needed; a new version alone does not indicate improvement.",
        evidence: p.evidence.map((e) => ({ ...e, quote: undefined })),
      }));
  return {
    fromVersion,
    toVersion: next,
    overallChange: first
      ? "Meaningful improvement"
      : fromVersion === 2
        ? "More careful, more complete"
        : "No further change in the sample",
    summary: first
      ? "A qualified thesis and an evaluated counterargument make this a stronger response. One analytical issue is partially addressed, source traceability remains incomplete, and the revision introduces a new factual claim and loses a conclusion strength."
      : fromVersion === 2
        ? "The second revision removes an unsupported claim and restores the conclusion’s wider significance. The remaining work is deeper urban-life analysis and complete source attribution."
        : "The demonstration has reached its final sample draft. This comparison does not assess your uploaded revision.",
    resolvedCount: changes.filter((c) => c.status === "Resolved").length,
    improvedCount: changes.filter((c) =>
      ["Improved", "Partially addressed"].includes(c.status),
    ).length,
    unresolvedCount: changes.filter((c) =>
      ["Unchanged", "Regressed", "Unable to determine"].includes(c.status),
    ).length,
    regressionsCount: first ? 1 : 0,
    newIssuesCount: first ? 1 : 0,
    recommendationChanges: changes,
    keyComparisons: first
      ? [
          {
            id: "bc-thesis",
            title: "A thesis that can hold the evidence",
            before: assignments[0].split("\n\n")[1],
            after: assignments[1].split("\n\n")[1],
            audit:
              "The revised thesis defines progress more carefully and distinguishes the contribution of growth from regulation.",
          },
          {
            id: "bc-economic",
            title: "From a generalization to a comparison",
            before:
              "Industrialization therefore improved life for all workers.",
            after:
              "For children facing injury and families living in unhealthy housing, income alone is an incomplete measure of progress.",
            audit:
              "This directly compares competing dimensions of wellbeing and recognizes differences between workers.",
          },
        ]
      : fromVersion === 2
        ? [
            {
              id: "bc-claim",
              title: "An unsupported claim becomes a bounded inference",
              before:
                "By 1850, sanitation reform had eliminated most waterborne disease across industrial Britain.",
              after:
                "The notes establish that sanitation reform developed gradually; they do not show that disease had been eliminated.",
              audit:
                "The revised statement accurately limits what can be inferred from the supplied material.",
            },
          ]
        : [],
    rubricChanges: current.rubric.map((r, i) => ({
      criterion: r.name,
      previous: previous.rubric[i].estimate || "Not estimated",
      current: r.estimate || "Not estimated",
      change:
        r.estimate === previous.rubric[i].estimate
          ? "Similar estimated range"
          : "Higher estimated range",
    })),
    teacherFeedbackChanges: current.teacherFeedback.map((t, i) => ({
      comment: t.comment,
      previous: previous.teacherFeedback[i].status,
      current: t.status,
      explanation: t.nextStep,
    })),
    newIssues: first
      ? [
          {
            id: "new-factual",
            title: "A new public-health claim needs support",
            detail:
              "The revision claims most waterborne disease was eliminated by 1850. The supplied notes establish gradual reform, not this date or extent.",
            suggestion: "Remove the claim or verify it with a suitable source.",
            evidence: [
              ev("assignment", "Urban life"),
              ev("context", "Lecture notes — Public health"),
            ],
          },
        ]
      : [],
    regressions: first
      ? [
          {
            id: "reg-conclusion",
            title: "The conclusion lost its wider significance",
            detail:
              "The tighter ending removes the original discussion of how economic growth should be judged, leaving an explicit instruction unmet.",
            suggestion:
              "Restore a concise reflection on the relationship between growth and wellbeing.",
            evidence: [
              ev("assignment", "Conclusion"),
              ev("instructions", "Requirement 6"),
            ],
          },
        ]
      : [],
  };
}
export function demoResult(input: AuditInput): AuditResult {
  const report = sampleReport(input.versionNumber);
  report.meta.createdAt = new Date().toISOString();
  return {
    report,
    analyzedSources: sampleMaterials(input.versionNumber),
    comparison: input.previousVersion
      ? sampleComparison(input.previousVersion.versionNumber)
      : undefined,
  };
}
export function createSampleProject(): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Industrialization and the Working Class",
    createdAt: now,
    updatedAt: now,
    versions: [1, 2, 3].map((n) => {
      const report = sampleReport(n);
      return {
        id: crypto.randomUUID(),
        versionNumber: n,
        createdAt: report.meta.createdAt,
        materials: sampleMaterials(n),
        analyzedSources: sampleMaterials(n),
        settings: defaultSettings,
        report,
        comparison: n > 1 ? sampleComparison(n - 1) : undefined,
        checkedItems: [],
      };
    }),
  };
}
