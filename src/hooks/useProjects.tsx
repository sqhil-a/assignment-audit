import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { Project } from "../types/audit";
import {
  readProjects,
  persistProjects,
  STORAGE_KEY,
} from "../services/storage";
interface ProjectsContext {
  projects: Project[];
  warning: string;
  save: (project: Project) => void;
  remove: (id: string) => void;
  retry: () => void;
}
const Context = createContext<ProjectsContext | null>(null);
export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return readProjects(localStorage);
    } catch {
      return {
        projects: [],
        warning:
          "Device storage is unavailable. Work will remain in this tab only.",
      };
    }
  });
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [warning, setWarning] = useState(initial.warning);
  const projectsRef = useRef(projects);
  const update = useCallback((transform: (items: Project[]) => Project[]) => {
    const next = transform(projectsRef.current);
    projectsRef.current = next;
    setProjects(next);
    try {
      setWarning(persistProjects(next, localStorage));
    } catch {
      setWarning(
        "Device storage is unavailable. Export your work before closing this tab.",
      );
    }
  }, []);
  const save = useCallback(
    (p: Project) =>
      update((items) =>
        [p, ...items.filter((x) => x.id !== p.id)].sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        ),
      ),
    [update],
  );
  const remove = useCallback(
    (id: string) => update((items) => items.filter((x) => x.id !== id)),
    [update],
  );
  const retry = () => {
    try {
      setWarning(persistProjects(projects, localStorage));
    } catch {
      setWarning(
        "Device storage is unavailable. Export your work before closing this tab.",
      );
    }
  };
  useEffect(() => {
    const handle = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY)
        setWarning(
          "History changed in another tab. Reload before editing to avoid overwriting its changes.",
        );
    };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);
  return (
    <Context.Provider value={{ projects, warning, save, remove, retry }}>
      {children}
    </Context.Provider>
  );
}
export function useProjects() {
  const context = useContext(Context);
  if (!context) throw new Error("Projects provider is missing");
  return context;
}
