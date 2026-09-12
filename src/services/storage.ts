import { ProjectSchema } from "../types/audit";
import type { Project } from "../types/audit";
export const STORAGE_KEY = "assignment-audit:projects:v1";
const BACKUP_KEY = "assignment-audit:recovery:v1";
export function readProjects(storage: Storage): {
  projects: Project[];
  warning: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { projects: [], warning: "" };
    const data = JSON.parse(raw);
    if (data.schemaVersion !== 1 || !Array.isArray(data.projects))
      throw new Error("Invalid storage");
    const projects: Project[] = [];
    let failed = 0;
    for (const p of data.projects) {
      const result = ProjectSchema.safeParse(p);
      if (result.success) projects.push(result.data);
      else failed++;
    }
    if (failed)
      try {
        storage.setItem(BACKUP_KEY, raw);
      } catch {
        throw new Error("Unable to preserve recovery data");
      }
    return {
      projects,
      warning: failed
        ? "Some saved projects could not be read. Their original data has been retained in local recovery storage. Export a recovery backup from Settings before clearing history."
        : "",
    };
  } catch {
    return {
      projects: [],
      warning:
        "Saved history could not be read. The original data has been retained. Export a recovery backup from Settings before saving new work.",
    };
  }
}
export function persistProjects(projects: Project[], storage: Storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.schemaVersion !== 1 || !Array.isArray(data.projects))
          throw new Error();
      } catch {
        storage.setItem(BACKUP_KEY, raw);
      }
    }
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, projects }),
    );
    return "";
  } catch {
    return "Device storage is full or unavailable. Changes are kept in this tab only. Export your report before closing, or delete older projects and retry saving.";
  }
}
export function recoveryData(storage: Storage) {
  return {
    saved: storage.getItem(STORAGE_KEY),
    recovery: storage.getItem(BACKUP_KEY),
  };
}
