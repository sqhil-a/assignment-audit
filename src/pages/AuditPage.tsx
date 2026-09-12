import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  LockKeyhole,
  Info,
  AlertCircle,
  Check,
} from "lucide-react";
import type { Source, AuditSettings, Project } from "../types/audit";
import { defaultSettings, SettingsSchema } from "../types/audit";
import MaterialInput from "../components/MaterialInput";
import AnalysisProgress from "../components/AnalysisProgress";
import { useProjects } from "../hooks/useProjects";
import { auditAssignment, isDemoMode, API_URL } from "../services/auditService";
import { sampleMaterials } from "../data/sampleMaterials";
export default function AuditPage() {
  const { projects, save } = useProjects();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const projectId = params.get("revision");
  const project = projects.find((p) => p.id === projectId);
  const previous = project?.versions.at(-1);
  const [materials, setMaterials] = useState<Source[]>(() =>
    previous ? previous.materials.filter((s) => s.role !== "assignment") : [],
  );
  const [settings, setSettings] = useState<AuditSettings>(
    previous?.settings || defaultSettings,
  );
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forceDemo, setForceDemo] = useState(
    previous?.report.meta.isDemo || false,
  );
  const [title, setTitle] = useState(project?.name || "");
  const controller = useRef<AbortController | undefined>(undefined);
  const busyRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const demo = isDemoMode || forceDemo;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function validate() {
    const work = materials.find((s) => s.role === "assignment");
    if (!work?.text.trim()) {
      setError("Add your assignment to continue.");
      return false;
    }
    if (materials.some((s) => s.status !== "ready")) {
      setError("Wait for reading to finish, or remove failed files.");
      return false;
    }
    setError("");
    return true;
  }
  async function run() {
    if (!validate() || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const versionNumber = (previous?.versionNumber || 0) + 1;
      const result = await auditAssignment(
        {
          materials,
          settings,
          versionNumber,
          previousVersion: previous,
          originalVersion: project?.versions[0],
        },
        abort.signal,
        { demo },
      );
      if (abort.signal.aborted) return;
      const now = new Date().toISOString();
      const newVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        createdAt: now,
        materials: structuredClone(materials),
        analyzedSources: result.analyzedSources,
        settings,
        report: result.report,
        comparison: result.comparison,
        checkedItems: [],
      };
      const updated: Project = project
        ? {
            ...project,
            updatedAt: now,
            versions: [...project.versions, newVersion],
          }
        : {
            id: crypto.randomUUID(),
            name:
              title.trim() ||
              materials
                .find((s) => s.role === "assignment")
                ?.name.replace(/\.[^.]+$/, "") ||
              result.report.meta.title,
            createdAt: now,
            updatedAt: now,
            versions: [newVersion],
          };
      save(updated);
      navigate(`/report/${updated.id}/${versionNumber}`);
    } catch (e) {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error ? e.message : "The audit failed. Please retry.",
        );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  if (projectId && !previous)
    return (
      <main id="main" className="narrow page">
        <h1>Revision context unavailable</h1>
        <p className="muted">
          Open a saved assignment from History to start a revision.
        </p>
        <Link className="button" to="/history">
          Open history
        </Link>
      </main>
    );
  if (busy)
    return (
      <AnalysisProgress
        demo={demo}
        onCancel={() => {
          controller.current?.abort();
          setBusy(false);
          busyRef.current = false;
        }}
      />
    );
  return (
    <main id="main" className="workspace page-enter">
      <div className="step-indicator" aria-label="Audit stages">
        {["Add materials", "Configure audit", "Review report"].map(
          (label, i) => (
            <span
              key={label}
              className={
                step === i + 1 ? "active" : step > i + 1 ? "completed" : ""
              }
            >
              <span>
                {step > i + 1 ? (
                  <Check size={12} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {label}
            </span>
          ),
        )}
      </div>
      <div className="workspace-heading">
        <div className="eyebrow">
          {previous
            ? `VERSION ${previous.versionNumber + 1} · REVISION ${previous.versionNumber}`
            : "NEW AUDIT"}
        </div>
        <h1>
          {step === 1
            ? previous
              ? "Bring your next draft."
              : "Start with your work."
            : "Make it your audit."}
        </h1>
        <p>
          {step === 1
            ? previous
              ? "Your rubric, feedback, and context are carried forward."
              : "Add your assignment. Include what it will be measured against."
            : "A few details to focus the review."}
        </p>
      </div>
      {error && (
        <div className="error-banner" role="alert" tabIndex={-1} ref={errorRef}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      <div className="workspace-grid">
        <div className="workspace-main">
          {step === 1 ? (
            <>
              <MaterialInput
                role="assignment"
                title={previous ? "Revised assignment" : "Assignment"}
                description="Upload a document or paste your text."
                materials={materials}
                onChange={(update) => {
                  setMaterials(update);
                  setError("");
                }}
                required
              />
              <MaterialInput
                role="instructions"
                title="Instructions"
                description="The task sheet, prompt, or expectations."
                materials={materials}
                onChange={(update) => {
                  setMaterials(update);
                  setError("");
                }}
              />
              <MaterialInput
                role="rubric"
                title="Rubric"
                description="The criteria your work will be assessed against."
                materials={materials}
                onChange={(update) => {
                  setMaterials(update);
                  setError("");
                }}
                recommended
              />
              <MaterialInput
                role="feedback"
                title="Teacher feedback"
                description="Comments from a previous draft or review."
                materials={materials}
                onChange={(update) => {
                  setMaterials(update);
                  setError("");
                }}
              />
              <MaterialInput
                role="context"
                title="Additional context"
                description="Notes, reference sources, exemplars, or formatting requirements."
                materials={materials}
                onChange={(update) => {
                  setMaterials(update);
                  setError("");
                }}
                multiple
              />
              <div className="workspace-footer">
                <span>
                  {materials.filter((s) => s.status === "ready").length}{" "}
                  {materials.filter((s) => s.status === "ready").length === 1
                    ? "material"
                    : "materials"}{" "}
                  ready
                </span>
                <button
                  className="button primary"
                  onClick={() => {
                    if (validate()) {
                      setStep(2);
                      window.scrollTo(0, 0);
                    }
                  }}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <section className="settings-form">
                <label htmlFor="project-title">
                  Assignment name <span className="muted">· optional</span>
                </label>
                <input
                  id="project-title"
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. History essay"
                  disabled={!!project}
                />
                <div className="form-columns">
                  <div>
                    <label htmlFor="assignment-type">Assignment type</label>
                    <select
                      id="assignment-type"
                      value={settings.assignmentType}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          assignmentType: e.target
                            .value as AuditSettings["assignmentType"],
                        }))
                      }
                    >
                      {SettingsSchema.shape.assignmentType.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="education-level">Education level</label>
                    <select
                      id="education-level"
                      value={settings.educationLevel}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          educationLevel: e.target
                            .value as AuditSettings["educationLevel"],
                        }))
                      }
                    >
                      {SettingsSchema.shape.educationLevel.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <fieldset className="depth-field">
                  <legend>Audit depth</legend>
                  {[
                    { name: "Quick", text: "The essentials" },
                    { name: "Standard", text: "A balanced review" },
                    { name: "Deep", text: "Every criterion and section" },
                  ].map(({ name, text }) => (
                    <label
                      key={name}
                      className={`depth-option ${settings.depth === name ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="depth"
                        value={name}
                        checked={settings.depth === name}
                        onChange={() =>
                          setSettings((s) => ({
                            ...s,
                            depth: name as AuditSettings["depth"],
                          }))
                        }
                      />
                      <span>
                        <strong>{name}</strong>
                        <span>{text}</span>
                      </span>
                      {name === "Deep" && (
                        <span className="field-label">Recommended</span>
                      )}
                    </label>
                  ))}
                </fieldset>
                {!materials.some((s) => s.role === "rubric") && (
                  <p className="inline-note">
                    <Info size={16} />
                    No rubric added. Scoring estimates will be unavailable.
                  </p>
                )}
                {!isDemoMode && !previous && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={forceDemo}
                      onChange={(e) => setForceDemo(e.target.checked)}
                    />
                    Use sample data instead of live analysis
                  </label>
                )}
                <div className="run-disclosure">
                  <LockKeyhole size={15} />
                  <p>
                    {demo
                      ? "Demo mode: your files stay here. The report will review our sample essay, not your work."
                      : `Extracted text will be sent ${API_URL === "/api/audit" ? "to Groq for analysis with openai/gpt-oss-20b" : "to the configured audit service"}. History is saved on this device.`}
                  </p>
                </div>
                <div className="workspace-footer">
                  <button
                    className="button plain"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    <ArrowLeft size={15} />
                    Materials
                  </button>
                  <button className="button primary" onClick={() => void run()}>
                    <FileCheck2 size={16} />
                    Run Assignment Audit
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
        <aside className="workspace-aside">
          <span className="eyebrow">
            {previous ? "REVISION CONTEXT" : "A MORE USEFUL REVIEW"}
          </span>
          <h3>
            {previous
              ? `${previous.materials.filter((s) => s.role !== "assignment").length} materials carried forward`
              : "Better context. Better feedback."}
          </h3>
          <p>
            {previous
              ? "Update any supporting material if your requirements have changed."
              : "A rubric makes the review more precise. Teacher comments help track what still needs attention."}
          </p>
          <div className="aside-rule" />
          <div className="privacy-line">
            <LockKeyhole size={15} />
            <span>
              {demo
                ? "Demo files stay on this device."
                : "Text is sent only when you run the audit."}
            </span>
          </div>
          {!previous && (
            <button
              className="text-button"
              onClick={() => {
                setMaterials(sampleMaterials());
                setTitle("Industrialization and the Working Class");
                setError("");
              }}
            >
              Use sample materials
              <ArrowRight size={13} />
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
