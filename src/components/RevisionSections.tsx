import type { RevisionComparison, Source } from "../types/audit";
import { Accordion, Badge, EvidenceList, statusTone, EmptyState } from "./ui";
import { AnalysisItems } from "./ReportSections";
export function RevisionOverview({
  comparison,
}: {
  comparison: RevisionComparison;
}) {
  return (
    <div className="revision-overview">
      <div className="revision-stats">
        {[
          { value: comparison.resolvedCount, label: "Resolved" },
          { value: comparison.improvedCount, label: "Improved / partial" },
          { value: comparison.unresolvedCount, label: "Unresolved" },
          { value: comparison.newIssuesCount, label: "New issues" },
          { value: comparison.regressionsCount, label: "Regressions" },
        ].map(({ value, label }) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <h3>{comparison.overallChange}</h3>
      <p>{comparison.summary}</p>
    </div>
  );
}
export function ResolutionTracking({
  comparison,
  sources,
}: {
  comparison: RevisionComparison;
  sources: Source[];
}) {
  return (
    <>
      {comparison.recommendationChanges.map((c) => (
        <Accordion
          key={c.recommendationId}
          title={c.title}
          badge={<Badge tone={statusTone(c.status)}>{c.status}</Badge>}
        >
          <div className="previous-issue">
            <h4>Previous issue</h4>
            <p>{c.previousIssue}</p>
          </div>
          <div className="detail-columns">
            <div>
              <h4>What changed</h4>
              <p>{c.whatChanged}</p>
            </div>
            <div>
              <h4>Why it matters</h4>
              <p>{c.why}</p>
            </div>
          </div>
          <EvidenceList evidence={c.evidence} sources={sources} />
        </Accordion>
      ))}
    </>
  );
}
export function BeforeAfter({
  comparison,
}: {
  comparison: RevisionComparison;
}) {
  return comparison.keyComparisons.length ? (
    <div className="before-after">
      {comparison.keyComparisons.map((c) => (
        <article key={c.id}>
          <h3>{c.title}</h3>
          <div className="comparison-columns">
            <div>
              <span className="eyebrow">
                BEFORE · V{comparison.fromVersion}
              </span>
              <p>{c.before}</p>
            </div>
            <div>
              <span className="eyebrow">AFTER · V{comparison.toVersion}</span>
              <p>{c.after}</p>
            </div>
          </div>
          <p className="comparison-audit">{c.audit}</p>
        </article>
      ))}
    </div>
  ) : (
    <EmptyState title="No material passage changes identified">
      The comparison focuses on meaningful changes to quality, rather than every
      wording edit.
    </EmptyState>
  );
}
export function NewIssues({
  comparison,
  sources,
  regressions = false,
}: {
  comparison: RevisionComparison;
  sources: Source[];
  regressions?: boolean;
}) {
  const items = regressions ? comparison.regressions : comparison.newIssues;
  return items.length ? (
    <AnalysisItems items={items} sources={sources} />
  ) : (
    <EmptyState
      title={
        regressions ? "No regressions identified" : "No new issues identified"
      }
    >
      Review recommendation tracking for remaining work.
    </EmptyState>
  );
}
export function RubricProgress({
  comparison,
}: {
  comparison: RevisionComparison;
}) {
  return comparison.rubricChanges.length ? (
    <>
      <div
        className="table-wrap"
        role="region"
        aria-label="Rubric progress"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th>V{comparison.fromVersion}</th>
              <th>V{comparison.toVersion}</th>
              <th>Movement</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rubricChanges.map((r, i) => (
              <tr key={i}>
                <td>{r.criterion}</td>
                <td>{r.previous}</td>
                <td>{r.current}</td>
                <td>{r.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        AI-estimated performance. Ranges express uncertainty.
      </p>
    </>
  ) : (
    <EmptyState title="No rubric estimates to compare">
      Add a consistent rubric to track criterion progress.
    </EmptyState>
  );
}
export function FeedbackProgress({
  comparison,
}: {
  comparison: RevisionComparison;
}) {
  return (
    <div className="feedback-progress">
      {comparison.teacherFeedbackChanges.map((t, i) => (
        <article key={i}>
          <h3>“{t.comment}”</h3>
          <div className="feedback-movement">
            <span>
              V{comparison.fromVersion} <Badge>{t.previous}</Badge>
            </span>
            <span aria-hidden="true">→</span>
            <span>
              V{comparison.toVersion}{" "}
              <Badge tone={statusTone(t.current)}>{t.current}</Badge>
            </span>
          </div>
          <p>{t.explanation}</p>
        </article>
      ))}
    </div>
  );
}
