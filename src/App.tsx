import { useState, useEffect, lazy, Suspense } from "react";
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { FileCheck2, Plus, History, Settings2, ArrowRight } from "lucide-react";
import HomePage from "./pages/HomePage";
import { ProjectsProvider, useProjects } from "./hooks/useProjects";
import { createSampleProject } from "./data/sampleRevision";
import { isDemoMode } from "./services/auditService";
import { useAuditTools } from "./hooks/useAuditTools";
import AppSettings from "./components/AppSettings";
import ErrorBoundary from "./components/ErrorBoundary";
const AuditPage = lazy(() => import("./pages/AuditPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ProjectPage = lazy(() =>
  import("./pages/HistoryPage").then((m) => ({ default: m.ProjectPage })),
);
function Shell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, save, warning, retry } = useProjects();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Assignment Audit";
  }, [location.pathname]);
  function openSample() {
    const existing = projects.find(
      (p) =>
        p.versions.length >= 3 &&
        p.versions.every((v) => v.report.meta.isDemo) &&
        p.name === "Industrialization and the Working Class",
    );
    const sample = existing || createSampleProject();
    if (!existing) save(sample);
    navigate(`/report/${sample.id}/1`);
    return { projectId: sample.id, versionNumber: 1 };
  }
  useAuditTools({ openSample, projects, save });
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const main = document.querySelector<HTMLElement>("main");
          main?.setAttribute("tabindex", "-1");
          main?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <Link to="/" className="wordmark">
          <span className="brand-icon">
            <FileCheck2 size={19} />
          </span>
          Assignment Audit
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/new" aria-label="New audit">
            <Plus size={16} />
            <span>New audit</span>
          </Link>
          <Link to="/history" aria-label="History">
            <History size={16} />
            <span>History</span>
          </Link>
          <span className="mode-label">
            <span />
            {isDemoMode ? "Demo mode" : "Live audit"}
          </span>
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 size={18} />
          </button>
        </nav>
      </header>
      {warning && (
        <div className="storage-warning" role="alert">
          <p>{warning}</p>
          <button onClick={retry}>Retry save</button>
        </div>
      )}
      <Suspense
        fallback={
          <main id="main" className="narrow page" role="status">
            Opening your workspace…
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage onSample={openSample} />} />
          <Route path="/new" element={<AuditPage key={location.key} />} />
          <Route
            path="/report/:projectId/:versionNumber?"
            element={<ReportPage />}
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route
            path="*"
            element={
              <main id="main" className="narrow page">
                <h1>Page not found</h1>
                <Link className="button" to="/">
                  Back to workspace
                  <ArrowRight size={15} />
                </Link>
              </main>
            }
          />
        </Routes>
      </Suspense>
      {settingsOpen && <AppSettings onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ProjectsProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </ProjectsProvider>
    </ErrorBoundary>
  );
}
