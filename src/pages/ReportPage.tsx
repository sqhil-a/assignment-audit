import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Copy,
  Download,
  FileText,
  GitCompareArrows,
  Plus,
  Printer,
  Check,
  List,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { Badge, Dialog, SectionHeading } from "../components/ui";
import {
  AnalysisItems,
  PriorityCards,
  RubricAudit,
  RequirementsCheck,
  FeedbackAudit,
  DetailedReview,
  RecommendedEdits,
  RevisionPlan,
  SubmissionChecklist,
} from "../components/ReportSections";
import {
  RevisionOverview,
  ResolutionTracking,
  BeforeAfter,
  NewIssues,
  RubricProgress,
  FeedbackProgress,
} from "../components/RevisionSections";
import { downloadJSON, reportSummary } from "../services/export";
import type { Source } from "../types/audit";
export default function ReportPage() {
  const { projectId, versionNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projects, save } = useProjects();
  const project = projects.find((p) => p.id === projectId);
  const version =
    project?.versions.find((v) => v.versionNumber === Number(versionNumber)) ||
    (!versionNumber ? project?.versions.at(-1) : undefined);
  const [active, setActive] = useState("overview");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [copyFallback, setCopyFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const report = version?.report;
  const comparison = version?.comparison;
  const sources = version?.analyzedSources || [];
  const sections: Array<{ id: string; label: string; group?: string }> = [
    { id: "overview", label: "Overview" },
    ...(comparison
      ? [
          {
            id: "revision-progress",
            label: "Revision progress",
            group: "REVISION",
          },
          { id: "resolution", label: "Recommendation tracking" },
          { id: "before-after", label: "Before & after" },
          { id: "new-issues", label: "New issues" },
          { id: "regressions", label: "Regressions" },
          { id: "rubric-progress", label: "Rubric progress" },
          ...(comparison.teacherFeedbackChanges.length
            ? [{ id: "feedback-progress", label: "Feedback progress" }]
            : []),
        ]
      : []),
    { id: "priorities", label: "Priority fixes", group: "CURRENT AUDIT" },
    { id: "rubric", label: "Rubric audit" },
    { id: "requirements", label: "Requirements" },
    { id: "teacher-feedback", label: "Teacher feedback" },
    { id: "detailed-review", label: "Detailed review" },
    ...(report?.evidenceAnalysis.length
      ? [{ id: "evidence", label: "Evidence & reasoning" }]
      : []),
    ...(report?.writingAnalysis.length
      ? [{ id: "writing", label: "Clarity & writing" }]
      : []),
    ...(report?.recommendedEdits.length
      ? [{ id: "edits", label: "Recommended edits" }]
      : []),
    { id: "strengths", label: "What’s working" },
    { id: "gaps", label: "Potential gaps" },
    { id: "revision-plan", label: "Revision plan", group: "NEXT STEPS" },
    { id: "checklist", label: "Before you submit" },
  ];
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      requestAnimationFrame(() =>
        document.getElementById(section)?.scrollIntoView({ block: "start" }),
      );
      setActive(section);
    } else {
      window.scrollTo(0, 0);
      setActive("overview");
    }
  }, [version?.id, searchParams]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -68% 0px", threshold: 0 },
    );
    document
      .querySelectorAll(".report-section")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [version?.id]);
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(
        document.querySelectorAll<HTMLDetailsElement>(
          ".report-body details:not([open])",
        ),
      );
      opened.forEach((d) => (d.open = true));
    };
    const after = () => {
      opened.forEach((d) => (d.open = false));
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  if (!project || !version || !report)
    return (
      <main id="main" className="narrow page">
        <h1>Report not found</h1>
        <p className="muted">
          This report may have been deleted or saved on another device.
        </p>
        <Link className="button" to="/history">
          Open history
        </Link>
      </main>
    );
  const jump = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  };
  const toggle = (id: string) =>
    save({
      ...project,
      versions: project.versions.map((v) =>
        v.id === version.id
          ? {
              ...v,
              checkedItems: v.checkedItems.includes(id)
                ? v.checkedItems.filter((x) => x !== id)
                : [...v.checkedItems, id],
            }
          : v,
      ),
    });
  async function copy() {
    try {
      await navigator.clipboard.writeText(reportSummary(report!));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyFallback(true);
    }
  }

  return (
    <main id="main" className="report-layout page-enter">
      <aside className="report-sidebar">
        <Link className="report-project-link" to={`/project/${project.id}`}>
          <span className="eyebrow">ASSIGNMENT</span>
          <strong>{project.name}</strong>
          <span>
            Version history
            <ArrowUpRight size={12} />
          </span>
        </Link>
        <nav aria-label="Report sections">
          {sections.map((s) => (
            <div key={s.id}>
              {s.group && <div className="nav-group">{s.group}</div>}
              <button
                className={active === s.id ? "active" : ""}
                aria-current={active === s.id ? "location" : undefined}
                onClick={() => jump(s.id)}
              >
                {s.label}
                {s.id === "priorities" && (
                  <span>{report.priorities.length}</span>
                )}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">Saved only on this device</div>
      </aside>
      <div className="report-body" key={version.id}>
        <div className="report-breadcrumb">
          <Link to="/history">History</Link>
          <span>/</span>
          <Link to={`/project/${project.id}`}>{project.name}</Link>
          <span>/</span>
          <span>Version {version.versionNumber}</span>
        </div>
        <header className="report-header">
          <div className="report-kicker">
            <span className="eyebrow">
              {comparison ? "REVISION AUDIT" : "ASSIGNMENT AUDIT"}
            </span>
            <Badge>{report.meta.isDemo ? "Sample report" : "AI review"}</Badge>
          </div>
          <h1>{report.meta.title}</h1>
          <div className="report-meta">
            <span>
              {new Date(version.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>{report.meta.assignmentType}</span>
            <span>{report.meta.depth} review</span>
            <button onClick={() => setSourcesOpen(true)}>
              {sources.length} {sources.length === 1 ? "source" : "sources"}
              <ArrowUpRight size={12} />
            </button>
            <label className="sr-only" htmlFor="version-select">
              Report version
            </label>
            <select
              id="version-select"
              value={version.versionNumber}
              onChange={(e) =>
                navigate(`/report/${project.id}/${e.target.value}`)
              }
            >
              {project.versions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  Version {v.versionNumber}
                  {v.versionNumber === 1
                    ? " · Original"
                    : ` · Revision ${v.versionNumber - 1}`}
                </option>
              ))}
            </select>
          </div>
          <div className="report-actions">
            <Link
              className="button primary small"
              to={`/new?revision=${project.id}`}
            >
              <GitCompareArrows size={15} />
              Re-Audit Revision
            </Link>
            <button
              className="button small"
              onClick={() => setExportOpen(true)}
            >
              <Download size={14} />
              Export
            </button>
            <button className="button small plain" onClick={() => void copy()}>
              {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
              {copied ? "Copied" : "Copy summary"}
            </button>
            <Link to="/new" className="report-new">
              <Plus size={14} />
              New audit
            </Link>
          </div>
        </header>
        {report.meta.isDemo && (
          <div className="demo-notice">
            <span className="demo-dot" />
            <p>
              Sample feedback on an example essay. Your uploaded work was not
              analyzed.
            </p>
          </div>
        )}
        <div className="mobile-report-nav">
          <List size={16} />
          <label className="sr-only" htmlFor="report-section-select">
            Jump to section
          </label>
          <select
            id="report-section-select"
            value={active}
            onChange={(e) => jump(e.target.value)}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <section id="overview" className="report-section overview-section">
          <div className="overall-card">
            <div className="overall-label">
              <span className="eyebrow">OVERALL READINESS</span>
              {report.overall.estimate && (
                <span className="estimate">Est. {report.overall.estimate}</span>
              )}
            </div>
            <h2>{report.overall.readiness}</h2>
            <p>{report.overall.evaluation}</p>
            <div className="overall-details">
              <div>
                <span className="eyebrow">MAIN STRENGTH</span>
                <p>{report.overall.mainStrength}</p>
              </div>
              <div>
                <span className="eyebrow">BIGGEST OPPORTUNITY</span>
                <p>{report.overall.biggestWeakness}</p>
              </div>
            </div>
            <div className="overall-action">
              <ArrowRight size={16} />
              <p>{report.overall.priorityAction}</p>
            </div>
          </div>
          <p className="footnote">{report.overall.uncertainty}</p>
          <div className="audit-summary">
            <h3>Audit Summary</h3>
            <p>{report.summary}</p>
          </div>
        </section>
        {comparison && (
          <>
            <ReportSection
              id="revision-progress"
              title="Revision Progress"
              subtitle={`Version ${comparison.fromVersion} → Version ${comparison.toVersion}`}
            >
              <RevisionOverview comparison={comparison} />
            </ReportSection>
            <ReportSection id="resolution" title="Recommendation Tracking">
              <ResolutionTracking comparison={comparison} sources={sources} />
            </ReportSection>
            <ReportSection id="before-after" title="Before & After">
              <BeforeAfter comparison={comparison} />
            </ReportSection>
            <ReportSection id="new-issues" title="New Issues">
              <NewIssues comparison={comparison} sources={sources} />
            </ReportSection>
            <ReportSection id="regressions" title="Regressions">
              <NewIssues
                comparison={comparison}
                sources={sources}
                regressions
              />
            </ReportSection>
            <ReportSection id="rubric-progress" title="Rubric Progress">
              <RubricProgress comparison={comparison} />
            </ReportSection>
            {comparison.teacherFeedbackChanges.length > 0 && (
              <ReportSection
                id="feedback-progress"
                title="Teacher Feedback Progress"
              >
                <FeedbackProgress comparison={comparison} />
              </ReportSection>
            )}
          </>
        )}
        <ReportSection
          id="priorities"
          title="Fix These First"
          subtitle="The changes with the greatest impact."
          aside={<Badge>{report.priorities.length} priorities</Badge>}
        >
          <PriorityCards report={report} sources={sources} />
        </ReportSection>
        <ReportSection id="rubric" title="Rubric Audit">
          <RubricAudit report={report} sources={sources} />
        </ReportSection>
        <ReportSection id="requirements" title="Requirements Check">
          <RequirementsCheck report={report} sources={sources} />
        </ReportSection>
        <ReportSection id="teacher-feedback" title="Teacher Feedback">
          <FeedbackAudit report={report} sources={sources} />
        </ReportSection>
        <ReportSection id="detailed-review" title="Detailed Review">
          <DetailedReview report={report} sources={sources} />
        </ReportSection>
        {report.evidenceAnalysis.length > 0 && (
          <ReportSection id="evidence" title="Evidence & Reasoning">
            <AnalysisItems items={report.evidenceAnalysis} sources={sources} />
          </ReportSection>
        )}
        {report.writingAnalysis.length > 0 && (
          <ReportSection id="writing" title="Clarity & Writing">
            <AnalysisItems items={report.writingAnalysis} sources={sources} />
          </ReportSection>
        )}
        {report.recommendedEdits.length > 0 && (
          <ReportSection id="edits" title="Recommended Edits">
            <RecommendedEdits report={report} sources={sources} />
          </ReportSection>
        )}
        <ReportSection id="strengths" title="What’s Working">
          <AnalysisItems items={report.strengths} sources={sources} />
        </ReportSection>
        <ReportSection id="gaps" title="Potential Gaps">
          <AnalysisItems items={report.gaps} sources={sources} />
        </ReportSection>
        <ReportSection id="revision-plan" title="Revision Plan">
          <RevisionPlan report={report} />
        </ReportSection>
        <ReportSection id="checklist" title="Before You Submit">
          <SubmissionChecklist
            report={report}
            checked={version.checkedItems}
            onToggle={toggle}
          />
        </ReportSection>
        <div className="re-audit-panel">
          <div>
            <GitCompareArrows size={24} />
            <h2>Your next draft, a clearer picture.</h2>
            <p>See what improved and what still needs work.</p>
          </div>
          <Link className="button primary" to={`/new?revision=${project.id}`}>
            Re-Audit Revision
            <ArrowRight size={16} />
          </Link>
        </div>
        <footer className="report-footer">
          Assignment Audit · Version {version.versionNumber}
          <span>A review to inform your judgment.</span>
        </footer>
      </div>
      {sourcesOpen && (
        <Dialog
          title="Sources analyzed"
          onClose={() => setSourcesOpen(false)}
          wide
        >
          <p className="muted dialog-intro">
            {report.meta.isDemo
              ? "This report analyzes the sample materials below. Your own uploads, if any, are retained separately."
              : "Extracted text was used for this audit. Visual layout and images are not assessed."}
          </p>
          <SourceRows
            sources={sources}
            label={comparison ? "Current revision" : ""}
          />
          {comparison &&
            project.versions.find(
              (v) => v.versionNumber === comparison.fromVersion,
            ) && (
              <SourceRows
                sources={project.versions
                  .find((v) => v.versionNumber === comparison.fromVersion)!
                  .analyzedSources.filter((s) => s.role === "assignment")}
                label={`Previous assignment · Version ${comparison.fromVersion}`}
              />
            )}{" "}
          {comparison && comparison.fromVersion > 1 && (
            <SourceRows
              sources={project.versions[0].analyzedSources.filter(
                (s) => s.role === "assignment",
              )}
              label="Original assignment · Version 1"
            />
          )}
          {report.meta.isDemo && (
            <details className="saved-materials">
              <summary>Your saved inputs · not analyzed in Demo Mode</summary>
              <SourceRows sources={version.materials} />
            </details>
          )}
        </Dialog>
      )}
      {exportOpen && (
        <Dialog title="Export report" onClose={() => setExportOpen(false)}>
          <div className="export-options">
            <button
              onClick={() => {
                setExportOpen(false);
                setTimeout(() => window.print(), 100);
              }}
            >
              <Printer size={20} />
              <span>
                <strong>Print / Save as PDF</strong>
                <small>Full report, optimized for paper</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
            <button
              onClick={() =>
                downloadJSON(
                  { schemaVersion: 1, projectName: project.name, version },
                  `${project.name}-v${version.versionNumber}`,
                )
              }
            >
              <FileText size={20} />
              <span>
                <strong>Report as JSON</strong>
                <small>Report, sources, checklist, and comparison</small>
              </span>
              <Download size={15} />
            </button>
            {comparison && (
              <button
                onClick={() =>
                  downloadJSON(
                    comparison,
                    `${project.name}-v${comparison.fromVersion}-v${comparison.toVersion}-comparison`,
                  )
                }
              >
                <GitCompareArrows size={20} />
                <span>
                  <strong>Revision comparison</strong>
                  <small>Changes between these versions</small>
                </span>
                <Download size={15} />
              </button>
            )}
          </div>
          <p className="footnote">
            JSON includes extracted assignment text and feedback.
          </p>
        </Dialog>
      )}
      {copyFallback && (
        <Dialog title="Copy summary" onClose={() => setCopyFallback(false)}>
          <p className="muted">
            Clipboard access is unavailable. Select and copy the text below.
          </p>
          <textarea
            readOnly
            rows={12}
            value={reportSummary(report)}
            onFocus={(e) => e.target.select()}
            aria-label="Report summary"
          />
        </Dialog>
      )}
    </main>
  );
}
const ReportSection = ({
  id,
  title,
  subtitle,
  children,
  aside,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
}) => (
  <section id={id} className="report-section">
    <SectionHeading title={title} subtitle={subtitle} aside={aside} />
    {children}
  </section>
);
function SourceRows({ sources, label }: { sources: Source[]; label?: string }) {
  return (
    <div className="source-rows">
      {label && <h3>{label}</h3>}
      {sources.map((s) => (
        <details key={s.id}>
          <summary>
            <FileText size={17} />
            <span>
              <strong>{s.name}</strong>
              <small>
                {s.role} · {s.type} · {(s.size / 1024).toFixed(1)} KB
              </small>
            </span>
            <Badge tone="positive">{s.status}</Badge>
          </summary>
          {s.warning && <p className="field-error">{s.warning}</p>}
          <pre>{s.text}</pre>
        </details>
      ))}
    </div>
  );
}
