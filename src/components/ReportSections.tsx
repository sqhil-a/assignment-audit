import { Check, CornerDownRight } from "lucide-react";
import type { AuditReport, Source, AnalysisItem } from "../types/audit";
import { Accordion, Badge, EvidenceList, EmptyState, statusTone } from "./ui";
export function AnalysisItems({
  items,
  sources,
}: {
  items: AnalysisItem[];
  sources: Source[];
}) {
  return (
    <div className="analysis-items">
      {items.map((item) => (
        <article className="analysis-item" key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
          {item.suggestion && (
            <div className="recommendation">
              <CornerDownRight size={16} />
              <p>{item.suggestion}</p>
            </div>
          )}
          <EvidenceList evidence={item.evidence} sources={sources} />
        </article>
      ))}
    </div>
  );
}
export function PriorityCards({
  report,
  sources,
}: {
  report: AuditReport;
  sources: Source[];
}) {
  return (
    <div className="priorities">
      {report.priorities.length ? (
        report.priorities.map((p, i) => (
          <article key={p.id} className="priority-card">
            <div className="priority-top">
              <span className="priority-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{p.title}</h3>
              <Badge tone={statusTone(p.severity)}>{p.severity} priority</Badge>
            </div>
            <p>{p.detail}</p>
            <div className="recommendation">
              <CornerDownRight size={16} />
              <p>{p.suggestion}</p>
            </div>
            <EvidenceList evidence={p.evidence} sources={sources} />
            <details className="impact">
              <summary>Why it matters</summary>
              <p>{p.impact}</p>
            </details>
          </article>
        ))
      ) : (
        <EmptyState title="No priority issues identified">
          Review any limitations below before submitting.
        </EmptyState>
      )}
    </div>
  );
}
export function RubricAudit({
  report,
  sources,
}: {
  report: AuditReport;
  sources: Source[];
}) {
  return report.rubric.length ? (
    <div>
      {report.rubric.map((r) => (
        <Accordion
          key={r.id}
          title={r.name}
          summary={r.expectation}
          badge={
            <>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              {r.estimate && (
                <span className="criterion-estimate">{r.estimate}</span>
              )}
            </>
          }
        >
          <div className="detail-columns">
            <div>
              <h4>What’s working</h4>
              <p>{r.strengths}</p>
            </div>
            <div>
              <h4>Where marks are at risk</h4>
              <p>{r.gaps}</p>
            </div>
          </div>
          <div className="next-level">
            <h4>Reach the next level</h4>
            <p>{r.nextLevel}</p>
            {r.edits.length > 0 && (
              <ul>
                {r.edits.map((edit, i) => (
                  <li key={i}>{edit}</li>
                ))}
              </ul>
            )}
          </div>
          <EvidenceList evidence={r.evidence} sources={sources} />
        </Accordion>
      ))}
      <p className="footnote">
        AI-estimated performance · not a guaranteed grade
      </p>
    </div>
  ) : (
    <EmptyState
      title={
        sources.some((s) => s.role === "rubric")
          ? "No assessable rubric criteria"
          : "No rubric added"
      }
    >
      Scoring and criterion-level feedback are unavailable. Add an explicit
      rubric to your next audit.
    </EmptyState>
  );
}
export function RequirementsCheck({
  report,
  sources,
}: {
  report: AuditReport;
  sources: Source[];
}) {
  return report.requirements.length ? (
    <div
      className="table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Assignment requirements"
    >
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Status</th>
            <th>Evidence & notes</th>
          </tr>
        </thead>
        <tbody>
          {report.requirements.map((r) => (
            <tr key={r.id}>
              <td>{r.requirement}</td>
              <td>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </td>
              <td>
                <p>{r.notes}</p>
                <EvidenceList evidence={r.evidence} sources={sources} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <EmptyState title="No explicit requirements identified">
      Add the assignment instructions to check coverage.
    </EmptyState>
  );
}
export function FeedbackAudit({
  report,
  sources,
}: {
  report: AuditReport;
  sources: Source[];
}) {
  return report.teacherFeedback.length ? (
    <div className="feedback-list">
      {report.teacherFeedback.map((f, i) => (
        <article key={f.id}>
          <div className="feedback-top">
            <span className="eyebrow">
              COMMENT {String(i + 1).padStart(2, "0")}
            </span>
            <Badge tone={statusTone(f.status)}>{f.status}</Badge>
          </div>
          <blockquote>“{f.comment}”</blockquote>
          {f.assessment && (
            <p className="feedback-assessment">{f.assessment}</p>
          )}
          <EvidenceList evidence={f.evidence} sources={sources} />
          <div className="recommendation">
            <CornerDownRight size={16} />
            <p>{f.nextStep}</p>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <EmptyState
      title={
        sources.some((s) => s.role === "feedback")
          ? "No assessable teacher comments"
          : "No teacher feedback added"
      }
    >
      Add previous comments to check whether they have been addressed.
    </EmptyState>
  );
}
export function DetailedReview({
  report,
  sources,
}: {
  report: AuditReport;
  sources: Source[];
}) {
  return (
    <>
      {report.sections.map((s) => (
        <Accordion key={s.id} title={s.name} summary={s.summary}>
          <div className="detail-columns">
            <div>
              <h4>Strengths</h4>
              <p>{s.strengths}</p>
            </div>
            <div>
              <h4>Issues</h4>
              <p>{s.issues}</p>
            </div>
          </div>
          <div className="recommendation">
            <CornerDownRight size={16} />
            <p>{s.suggestion}</p>
          </div>
          <EvidenceList evidence={s.evidence} sources={sources} />
        </Accordion>
      ))}
    </>
  );
}
export function RecommendedEdits({
  report,
  sources,
}: {
  report: AuditReport;
  sources: Source[];
}) {
  return (
    <div className="edits">
      {report.recommendedEdits.map((e) => (
        <article key={e.id}>
          <h3>{e.location}</h3>
          <div className="edit-columns">
            <div>
              <span className="eyebrow">CURRENT</span>
              <blockquote>{e.current}</blockquote>
              <p>{e.issue}</p>
            </div>
            <div>
              <span className="eyebrow">RECOMMENDED DIRECTION</span>
              <p>{e.direction}</p>
            </div>
          </div>
          <EvidenceList evidence={e.evidence} sources={sources} />
        </article>
      ))}
    </div>
  );
}
export function RevisionPlan({ report }: { report: AuditReport }) {
  return (
    <div className="revision-plan">
      {(
        [
          { key: "first", label: "Do first" },
          { key: "next", label: "Do next" },
          { key: "polish", label: "Polish" },
        ] as const
      ).map(({ key, label }, i) => (
        <div key={key}>
          <span className="eyebrow">0{i + 1}</span>
          <h3>{label}</h3>
          <ul>
            {report.revisionPlan[key].map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
export function SubmissionChecklist({
  report,
  checked,
  onToggle,
}: {
  report: AuditReport;
  checked: string[];
  onToggle: (id: string) => void;
}) {
  const done = report.finalChecklist.filter((i) =>
    checked.includes(i.id),
  ).length;
  return (
    <div className="submission-checklist">
      <div className="checklist-meta">
        <span>
          {done} of {report.finalChecklist.length} complete
        </span>
        <span>Saved on this device</span>
      </div>
      {report.finalChecklist.map((item) => (
        <label
          key={item.id}
          className={checked.includes(item.id) ? "checked" : ""}
        >
          <input
            type="checkbox"
            checked={checked.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
          <span className="custom-check" aria-hidden="true">
            {checked.includes(item.id) && <Check size={13} />}
          </span>
          <span>{item.text}</span>
        </label>
      ))}
    </div>
  );
}
