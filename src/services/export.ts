import type { AuditReport } from "../types/audit";
export function downloadJSON(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.replace(/[^a-z0-9_-]/gi, "-").slice(0, 90)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function reportSummary(report: AuditReport) {
  return `${report.meta.isDemo ? "DEMONSTRATION REPORT — sample work only\n\n" : ""}${report.meta.title}\nVersion ${report.meta.versionNumber} · ${report.overall.readiness}\n\n${report.summary}\n\nFix these first\n${report.priorities.map((p, i) => `${i + 1}. ${p.title}\n${p.suggestion}`).join("\n\n")}\n\n${report.overall.uncertainty}`;
}
