import { useEffect, useRef } from "react";
import { z } from "zod";
import type { Project } from "../types/audit";
interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => Promise<unknown>;
}
interface ToolContext {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
}
interface Actions {
  openSample: () => { projectId: string; versionNumber: number };
  projects: Project[];
  save: (project: Project) => void;
}
const checklistInput = z
  .object({
    projectId: z.string(),
    versionNumber: z.number().int().positive(),
    items: z.array(z.object({ id: z.string(), checked: z.boolean() })).max(100),
  })
  .strict();
export function useAuditTools(actions: Actions) {
  const ref = useRef(actions);
  ref.current = actions;
  useEffect(() => {
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const painted = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const tools: Tool[] = [
      {
        name: "open_sample_report",
        title: "Open sample audit",
        description:
          "Open the built-in example report. Creates a local sample project if needed; no materials are transmitted.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          z.object({}).strict().parse(input);
          const result = ref.current.openSample();
          await painted();
          return result;
        },
      },
      {
        name: "set_submission_checklist",
        title: "Update submission checklist",
        description:
          "Set checklist items on a saved audit version. Updates local state only. Item IDs must come from that report.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            versionNumber: { type: "integer", minimum: 1 },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  checked: { type: "boolean" },
                },
                required: ["id", "checked"],
                additionalProperties: false,
              },
            },
          },
          required: ["projectId", "versionNumber", "items"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        async execute(input) {
          const data = checklistInput.parse(input);
          const project = ref.current.projects.find(
            (p) => p.id === data.projectId,
          );
          const version = project?.versions.find(
            (v) => v.versionNumber === data.versionNumber,
          );
          if (!project || !version) throw new Error("Saved version not found.");
          if (
            data.items.some(
              (i) => !version.report.finalChecklist.some((c) => c.id === i.id),
            )
          )
            throw new Error("Unknown checklist item. No changes were made.");
          const checked = new Set(version.checkedItems);
          for (const item of data.items) {
            if (item.checked) checked.add(item.id);
            else checked.delete(item.id);
          }
          ref.current.save({
            ...project,
            versions: project.versions.map((v) =>
              v.id === version.id ? { ...v, checkedItems: [...checked] } : v,
            ),
          });
          await painted();
          return {
            projectId: project.id,
            versionNumber: version.versionNumber,
            checkedItems: [...checked],
          };
        },
      },
    ];
    try {
      for (const tool of tools)
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => lifecycle.abort());
    } catch {
      lifecycle.abort();
    }
    return () => lifecycle.abort();
  }, []);
}
