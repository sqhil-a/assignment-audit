import { z } from "zod";

const text = z.string().max(30000);
const id = z.string().min(1).max(200);
export const SourceSchema = z.object({
  id,
  role: z.enum(["assignment", "instructions", "rubric", "feedback", "context"]),
  name: z.string().min(1).max(300),
  text: z.string().max(160000),
  size: z.number().nonnegative(),
  type: z.string(),
  status: z.enum(["ready", "reading", "failed"]),
  warning: text.optional(),
});
export type Source = z.infer<typeof SourceSchema>;
export type SourceRole = Source["role"];
export const SettingsSchema = z.object({
  assignmentType: z.enum([
    "Essay",
    "Research paper",
    "Lab report",
    "Presentation",
    "Case study",
    "Reflection",
    "Written response",
    "Project",
    "Other",
  ]),
  educationLevel: z.enum([
    "Middle school",
    "High school",
    "IB / AP",
    "College",
    "University",
    "Other",
  ]),
  depth: z.enum(["Quick", "Standard", "Deep"]),
});
export type AuditSettings = z.infer<typeof SettingsSchema>;
export const defaultSettings: AuditSettings = {
  assignmentType: "Essay",
  educationLevel: "University",
  depth: "Deep",
};
export const EvidenceSchema = z.object({
  sourceId: id,
  location: text,
  quote: text.optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;
const evidence = z.array(EvidenceSchema).max(30).default([]);
export const AnalysisItemSchema = z.object({
  id,
  title: text,
  detail: text,
  evidence,
  suggestion: text.default(""),
});
export type AnalysisItem = z.infer<typeof AnalysisItemSchema>;
export const PrioritySchema = AnalysisItemSchema.extend({
  severity: z.enum(["High", "Medium", "Low"]),
  impact: text,
});
export type PriorityIssue = z.infer<typeof PrioritySchema>;
export const RubricSchema = z.object({
  id,
  name: text,
  expectation: text,
  estimate: text.optional(),
  status: z.enum(["Strong", "Nearly there", "Needs work", "Unclear"]),
  strengths: text,
  gaps: text,
  evidence,
  nextLevel: text,
  edits: z.array(text).default([]),
});
export const RequirementSchema = z.object({
  id,
  requirement: text,
  status: z.enum(["Met", "Partially met", "Missing", "Unclear"]),
  evidence,
  notes: text,
});
export const FeedbackSchema = z.object({
  id,
  comment: text,
  status: z.enum([
    "Addressed",
    "Partially addressed",
    "Not addressed",
    "Unable to determine",
  ]),
  evidence,
  assessment: text.default(""),
  nextStep: text,
});
export const SectionSchema = z.object({
  id,
  name: text,
  summary: text,
  strengths: text,
  issues: text,
  suggestion: text,
  evidence,
});
export const ReportSchema = z.object({
  meta: z.object({
    title: z.string().min(1).max(300),
    createdAt: z.string().datetime(),
    versionNumber: z.number().int().positive(),
    assignmentType: text,
    depth: text,
    sourceCount: z.number().int().nonnegative(),
    isDemo: z.boolean(),
  }),
  overall: z.object({
    readiness: text,
    evaluation: text,
    mainStrength: text,
    biggestWeakness: text,
    priorityAction: text,
    estimate: text.optional(),
    uncertainty: text.default(
      "This is an academic review, not a guaranteed grade.",
    ),
  }),
  summary: text,
  priorities: z.array(PrioritySchema).max(30),
  rubric: z.array(RubricSchema).max(50).default([]),
  requirements: z.array(RequirementSchema).max(100).default([]),
  teacherFeedback: z.array(FeedbackSchema).max(100).default([]),
  sections: z.array(SectionSchema).max(100).default([]),
  evidenceAnalysis: z.array(AnalysisItemSchema).max(100).default([]),
  writingAnalysis: z.array(AnalysisItemSchema).max(100).default([]),
  strengths: z.array(AnalysisItemSchema).max(100).default([]),
  gaps: z.array(AnalysisItemSchema).max(100).default([]),
  recommendedEdits: z
    .array(
      z.object({
        id,
        location: text,
        current: text,
        issue: text,
        direction: text,
        evidence,
      }),
    )
    .max(100)
    .default([]),
  revisionPlan: z.object({
    first: z.array(text),
    next: z.array(text),
    polish: z.array(text),
  }),
  finalChecklist: z.array(z.object({ id, text })).max(100),
});
export type AuditReport = z.infer<typeof ReportSchema>;
export const ResolutionSchema = z.object({
  recommendationId: id,
  title: text,
  previousIssue: text,
  status: z.enum([
    "Resolved",
    "Improved",
    "Partially addressed",
    "Unchanged",
    "Regressed",
    "Unable to determine",
  ]),
  whatChanged: text,
  why: text,
  evidence,
});
export const ComparisonSchema = z.object({
  fromVersion: z.number().int().positive(),
  toVersion: z.number().int().positive(),
  overallChange: text,
  summary: text,
  resolvedCount: z.number().int().nonnegative(),
  improvedCount: z.number().int().nonnegative(),
  unresolvedCount: z.number().int().nonnegative(),
  regressionsCount: z.number().int().nonnegative(),
  newIssuesCount: z.number().int().nonnegative(),
  recommendationChanges: z.array(ResolutionSchema).max(100),
  keyComparisons: z
    .array(
      z.object({ id, title: text, before: text, after: text, audit: text }),
    )
    .max(50),
  rubricChanges: z
    .array(
      z.object({
        criterion: text,
        previous: text,
        current: text,
        change: text,
      }),
    )
    .max(50),
  teacherFeedbackChanges: z
    .array(
      z.object({
        comment: text,
        previous: text,
        current: text,
        explanation: text,
      }),
    )
    .max(100),
  newIssues: z.array(AnalysisItemSchema).max(100),
  regressions: z.array(AnalysisItemSchema).max(100),
});
export type RevisionComparison = z.infer<typeof ComparisonSchema>;
export const VersionSchema = z.object({
  id,
  versionNumber: z.number().int().positive(),
  createdAt: z.string().datetime(),
  materials: z.array(SourceSchema).max(24),
  analyzedSources: z.array(SourceSchema).max(24),
  settings: SettingsSchema,
  report: ReportSchema,
  comparison: ComparisonSchema.optional(),
  checkedItems: z.array(id).default([]),
});
export type AuditVersion = z.infer<typeof VersionSchema>;
export const ProjectSchema = z.object({
  id,
  name: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  versions: z.array(VersionSchema).min(1).max(100),
});
export type Project = z.infer<typeof ProjectSchema>;
export interface AuditInput {
  materials: Source[];
  settings: AuditSettings;
  versionNumber: number;
  previousVersion?: AuditVersion;
  originalVersion?: AuditVersion;
}
export interface AuditResult {
  report: AuditReport;
  comparison?: RevisionComparison;
  analyzedSources: Source[];
}
