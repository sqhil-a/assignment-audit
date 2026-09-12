import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  FileText,
  MoreHorizontal,
  GitCompareArrows,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { Badge, Dialog, EmptyState } from "../components/ui";
import type { Project } from "../types/audit";
export default function HistoryPage() {
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Project>();
  const visible = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main id="main" className="history-page page-enter">
      <div className="history-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>History</h1>
          <p>Saved only on this device.</p>
        </div>
        <Link className="button primary" to="/new">
          <Plus size={16} />
          New audit
        </Link>
      </div>
      {projects.length > 0 && (
        <div className="history-search">
          <Search size={17} />
          <label className="sr-only" htmlFor="search-projects">
            Search assignments
          </label>
          <input
            id="search-projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find an assignment…"
          />
        </div>
      )}
      {visible.length ? (
        <div className="project-list">
          {visible.map((p) => (
            <article key={p.id}>
              <span className="project-icon">
                <FileText size={22} />
              </span>
              <Link className="project-main" to={`/project/${p.id}`}>
                <h2>{p.name}</h2>
                <span>
                  {p.versions.length}{" "}
                  {p.versions.length === 1 ? "version" : "versions"} · Last
                  audited{" "}
                  {new Date(p.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <p>{p.versions.at(-1)?.report.overall.readiness}</p>
              </Link>
              {p.versions.at(-1)?.report.meta.isDemo && <Badge>Sample</Badge>}
              <button
                className="icon-button"
                aria-label={`Manage ${p.name}`}
                onClick={() => setEditing(p)}
              >
                <MoreHorizontal size={20} />
              </button>
              <Link
                to={`/project/${p.id}`}
                className="icon-button"
                aria-label={`Open ${p.name}`}
              >
                <ArrowUpRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            projects.length
              ? "No matching assignments"
              : "A place for your progress"
          }
        >
          {projects.length
            ? "Try a different search."
            : "Your audits and revisions will appear here."}
        </EmptyState>
      )}
      {editing && (
        <ProjectDialog
          project={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </main>
  );
}
export function ProjectPage() {
  const { projectId } = useParams();
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === projectId);
  const [editing, setEditing] = useState(false);
  if (!project)
    return (
      <main id="main" className="narrow page">
        <h1>Assignment not found</h1>
        <Link className="button" to="/history">
          Open history
        </Link>
      </main>
    );
  const latest = project.versions.at(-1)!;
  return (
    <main id="main" className="project-page page-enter">
      <Link className="back-link" to="/history">
        ← History
      </Link>
      <div className="history-heading">
        <div>
          <div className="eyebrow">ASSIGNMENT PROJECT</div>
          <h1>{project.name}</h1>
          <p>{project.versions.length} versions · Saved only on this device</p>
        </div>
        <button
          className="icon-button"
          aria-label="Manage assignment"
          onClick={() => setEditing(true)}
        >
          <MoreHorizontal size={23} />
        </button>
      </div>
      <div className="button-row project-actions">
        <Link className="button primary" to={`/new?revision=${project.id}`}>
          <GitCompareArrows size={16} />
          Re-Audit Revision
        </Link>
        <Link
          className="button"
          to={`/report/${project.id}/${latest.versionNumber}`}
        >
          Latest report
          <ArrowRight size={16} />
        </Link>
      </div>
      <section className="timeline">
        <h2>Revision timeline</h2>
        {[...project.versions].reverse().map((v) => (
          <article className="timeline-item" key={v.id}>
            <span className="timeline-node">
              {String(v.versionNumber).padStart(2, "0")}
            </span>
            <div>
              <div className="timeline-top">
                <h3>
                  Version {v.versionNumber}
                  <span>
                    {v.versionNumber === 1
                      ? "Original"
                      : `Revision ${v.versionNumber - 1}`}
                  </span>
                </h3>
                <span className="muted">
                  {new Date(v.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="timeline-readiness">{v.report.overall.readiness}</p>
              <div className="timeline-meta">
                {v.report.overall.estimate && (
                  <span>Est. {v.report.overall.estimate}</span>
                )}
                <span>{v.report.priorities.length} priorities remaining</span>
                {v.report.meta.isDemo && <Badge>Sample</Badge>}
              </div>
              <div className="button-row">
                <Link
                  className="text-button"
                  to={`/report/${project.id}/${v.versionNumber}`}
                >
                  Open report
                  <ArrowUpRight size={14} />
                </Link>
                {v.comparison && (
                  <Link
                    className="text-button"
                    to={`/report/${project.id}/${v.versionNumber}?section=revision-progress`}
                  >
                    Compare V{v.comparison.fromVersion} → V{v.versionNumber}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
      {project.versions.some((v) => v.report.rubric.length > 0) && (
        <section className="project-progress">
          <h2>Rubric history</h2>
          <p className="footnote">
            AI-estimated performance · compare within a consistent rubric
          </p>
          <div
            className="table-wrap"
            role="region"
            tabIndex={0}
            aria-label="Rubric estimates across versions"
          >
            <table>
              <thead>
                <tr>
                  <th>Criterion</th>
                  {project.versions.map((v) => (
                    <th key={v.id}>V{v.versionNumber}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  new Set(
                    project.versions.flatMap((v) =>
                      v.report.rubric.map((r) => r.name),
                    ),
                  ),
                ).map((name) => (
                  <tr key={name}>
                    <td>{name}</td>
                    {project.versions.map((v) => (
                      <td key={v.id}>
                        {v.report.rubric.find((r) => r.name === name)
                          ?.estimate || "Not estimated"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {project.versions.some((v) => v.report.teacherFeedback.length > 0) && (
        <section className="project-progress">
          <h2>Teacher feedback history</h2>
          <div
            className="table-wrap"
            role="region"
            tabIndex={0}
            aria-label="Teacher feedback across versions"
          >
            <table>
              <thead>
                <tr>
                  <th>Teacher comment</th>
                  {project.versions.map((v) => (
                    <th key={v.id}>V{v.versionNumber}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  new Set(
                    project.versions.flatMap((v) =>
                      v.report.teacherFeedback.map((t) => t.comment),
                    ),
                  ),
                ).map((comment) => (
                  <tr key={comment}>
                    <td>“{comment}”</td>
                    {project.versions.map((v) => (
                      <td key={v.id}>
                        {v.report.teacherFeedback.find(
                          (t) => t.comment === comment,
                        )?.status || "Not included"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {editing && (
        <ProjectDialog project={project} onClose={() => setEditing(false)} />
      )}
    </main>
  );
}
function ProjectDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { save, remove } = useProjects();
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <Dialog
      title={confirm ? "Delete assignment?" : "Manage assignment"}
      onClose={onClose}
    >
      {confirm ? (
        <>
          <p className="muted">
            This removes “{project.name}” and all {project.versions.length}{" "}
            versions from this device. This cannot be undone.
          </p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                remove(project.id);
                onClose();
                navigate("/history");
              }}
            >
              Delete assignment
            </button>
          </div>
        </>
      ) : (
        <>
          <label htmlFor="rename-project">Assignment name</label>
          <input
            id="rename-project"
            value={name}
            maxLength={200}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="dialog-actions">
            <button
              className="text-button danger-text"
              onClick={() => setConfirm(true)}
            >
              Delete assignment
            </button>
            <button
              className="button primary"
              disabled={!name.trim()}
              onClick={() => {
                save({ ...project, name: name.trim() });
                onClose();
              }}
            >
              Save name
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
