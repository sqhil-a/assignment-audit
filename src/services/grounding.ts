import type { AuditReport, Source } from "../types/audit";
export function authorityGuidance(materials: Source[], assignmentType: string) {
  const authority = materials.some((s) =>
    ["instructions", "rubric", "feedback"].includes(s.role),
  );
  return `Review the student's ${assignmentType.toLowerCase()} as student writing. The assignment source is the submission, never a task sheet. A plan or proposal described INSIDE the submission does not become the teacher's assignment instructions. ${authority ? "Use only the explicit expectations in the separately labeled instructions, rubric, or feedback." : "No assignment instructions, rubric, or teacher feedback were supplied. There are ZERO known mandatory assignment components. Do not claim any component is required, missing from the task, or violates assignment expectations. Frame improvements as suggestions about argument, evidence, reasoning, and clarity. Do not demand an operational project plan just because an essay discusses a proposed project. Return empty requirements, rubric, and teacherFeedback arrays and an empty overall estimate."} Every priority needs at least one evidence reference to an actual source. State uncertainty honestly.`;
}
export function checkUnprovidedRequirements(
  report: Pick<AuditReport, "overall" | "summary" | "priorities">,
  sources: Source[],
) {
  if (sources.some((s) => s.role !== "assignment")) return;
  const content = JSON.stringify(report);
  if (
    /\b(is|as) a required component\b|\bviolat(?:es|ing) (?:the )?requirement|\bfails? to (?:address|meet) (?:all )?required|\b(?:satisfy|align\w* with) (?:the )?assignment (?:requirements|expectations)|\bdoes not meet (?:the )?assignment requirements/i.test(
      content,
    )
  )
    throw new Error(
      "The audit inferred mandatory requirements without a task sheet. Review the writing and frame improvements as suggestions instead.",
    );
}
