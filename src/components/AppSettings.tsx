import { Dialog, Badge } from "./ui";
import { isDemoMode, API_URL } from "../services/auditService";
import { downloadJSON } from "../services/export";
import { recoveryData } from "../services/storage";
import { useState } from "react";
export default function AppSettings({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [connection, setConnection] = useState("");
  async function checkConnection() {
    setChecking(true);
    setConnection("");
    try {
      const response = await fetch("/api/health", {
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok || result.connected !== true)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "The AI service is unavailable.",
        );
      setConnection("Connected to Groq · openai/gpt-oss-20b");
    } catch (e) {
      setConnection(
        e instanceof Error ? e.message : "Connection failed. Please retry.",
      );
    } finally {
      setChecking(false);
    }
  }
  return (
    <Dialog title="Settings" onClose={onClose}>
      <div className="settings-info">
        <div>
          <h3>Analysis</h3>
          <Badge>
            {isDemoMode
              ? "Demo mode"
              : API_URL === "/api/audit"
                ? "Groq · live development"
                : "Connected"}
          </Badge>
        </div>
        <p>
          {isDemoMode
            ? "Sample reports only. Uploaded work is not analyzed."
            : API_URL === "/api/audit"
              ? "Model: openai/gpt-oss-20b. Your API key stays in the local development server."
              : "Extracted materials are sent to the configured audit endpoint."}
        </p>
        {import.meta.env.DEV && (API_URL === "/api/audit" || isDemoMode) && (
          <>
            <button
              className="button small"
              onClick={checkConnection}
              disabled={checking}
            >
              {checking ? "Checking…" : "Test AI connection"}
            </button>
            {connection && <p role="status">{connection}</p>}
          </>
        )}
        <div>
          <h3>Local history</h3>
        </div>
        <p>
          Extracted text, reports, and revisions stay in this browser. Original
          files are not saved. Clearing browser storage removes your history.
        </p>
        <button
          className="button small"
          onClick={() => {
            try {
              downloadJSON(
                recoveryData(localStorage),
                "assignment-audit-backup",
              );
            } catch {
              setError(
                "Browser storage is unavailable. Export individual reports instead.",
              );
            }
          }}
        >
          Export history backup
        </button>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <p className="footnote">
          Backups contain assignment text and teacher feedback.
        </p>
      </div>
    </Dialog>
  );
}
