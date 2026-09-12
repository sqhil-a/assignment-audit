import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  X,
  Plus,
  LoaderCircle,
  AlertCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  parseFile,
  validateFile,
  readableError,
  ACCEPTED_FILES,
  MAX_TEXT_LENGTH,
} from "../services/fileParser";
import type { Source, SourceRole } from "../types/audit";
interface Props {
  role: SourceRole;
  title: string;
  description: string;
  materials: Source[];
  onChange: (update: (old: Source[]) => Source[]) => void;
  required?: boolean;
  recommended?: boolean;
  multiple?: boolean;
  initialOpen?: boolean;
}
export default function MaterialInput({
  role,
  title,
  description,
  materials,
  onChange,
  required = false,
  recommended = false,
  multiple = false,
  initialOpen = false,
}: Props) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [paste, setPaste] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const own = materials.filter((s) => s.role === role);
  async function addFiles(files: File[]) {
    setError("");
    const selected = multiple ? files : files.slice(0, 1);
    if (!multiple && files.length > 1) {
      setError(
        "Choose one file for this section. Use Additional Context for more documents.",
      );
      return;
    }
    if (materials.length + selected.length - (multiple ? 0 : own.length) > 24) {
      setError("You can add up to 24 materials per audit.");
      return;
    }
    for (const file of selected) {
      try {
        validateFile(file);
      } catch (e) {
        setError(readableError(e));
        continue;
      }
      const id = crypto.randomUUID();
      const pending: Source = {
        id,
        name: file.name,
        text: "",
        role,
        size: file.size,
        type: file.name.split(".").pop()?.toUpperCase() || "FILE",
        status: "reading",
      };
      onChange((old) => [
        ...old.filter((s) => multiple || s.role !== role),
        pending,
      ]);
      try {
        const ready = await parseFile(file, role, id);
        onChange((old) => old.map((s) => (s.id === id ? ready : s)));
      } catch (e) {
        const warning = readableError(e);
        onChange((old) =>
          old.map((s) =>
            s.id === id ? { ...s, status: "failed", warning } : s,
          ),
        );
      }
    }
  }
  function addPasted() {
    if (!paste.trim()) {
      setError("Paste some text before adding this material.");
      return;
    }
    if (paste.length > MAX_TEXT_LENGTH) {
      setError(
        "This text exceeds 160,000 characters. Add only the relevant sections.",
      );
      return;
    }
    if (!editingId && materials.length >= 24) {
      setError("You can add up to 24 materials per audit.");
      return;
    }
    const source: Source = {
      id: editingId || crypto.randomUUID(),
      name: editingId
        ? own.find((s) => s.id === editingId)?.name || title
        : multiple
          ? `Additional context ${own.length + 1}`
          : `${title} · pasted text`,
      text: paste.trim(),
      role,
      size: new TextEncoder().encode(paste).length,
      type: "TEXT",
      status: "ready",
    };
    onChange((old) => [
      ...old.filter((s) => s.id !== editingId && (multiple || s.role !== role)),
      source,
    ]);
    setPaste("");
    setEditingId(undefined);
    setMode("upload");
    setError("");
  }
  const content = (
    <>
      <p className="material-description">{description}</p>
      {own.map((source) => (
        <div
          className={`file-row ${source.status === "failed" ? "failed" : ""}`}
          key={source.id}
        >
          <FileText size={21} />
          <div className="file-info">
            <strong>{source.name}</strong>
            <span>
              {source.type} ·{" "}
              {source.size < 1024
                ? `${source.size} B`
                : `${(source.size / 1024).toFixed(1)} KB`}{" "}
              ·{" "}
              {source.status === "ready"
                ? `${source.text.split(/\s+/).length.toLocaleString()} words`
                : ""}
            </span>
            {source.warning && <p className="file-warning">{source.warning}</p>}
            <details className="source-text compact">
              <summary>Review extracted text</summary>
              <pre>{source.text || "No readable text is available."}</pre>
            </details>
          </div>
          <span className={`file-status ${source.status}`}>
            {source.status === "reading" ? (
              <LoaderCircle size={13} className="spinning" />
            ) : source.status === "ready" ? (
              <Check size={13} />
            ) : (
              <AlertCircle size={13} />
            )}
            <span>
              {source.status === "ready"
                ? "Ready"
                : source.status === "reading"
                  ? "Reading"
                  : "Failed"}
            </span>
          </span>
          {source.type === "TEXT" && (
            <button
              className="text-button"
              onClick={() => {
                setPaste(source.text);
                setEditingId(source.id);
                setMode("paste");
              }}
            >
              Edit
            </button>
          )}
          <button
            className="icon-button"
            aria-label={`Remove ${source.name}`}
            onClick={() => {
              onChange((old) => old.filter((s) => s.id !== source.id));
              if (editingId === source.id) {
                setEditingId(undefined);
                setPaste("");
              }
            }}
          >
            <X size={17} />
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label={`Upload ${title}`}
        accept={ACCEPTED_FILES}
        multiple={multiple}
        onChange={(e) => {
          void addFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />
      {mode === "paste" ? (
        <div className="paste-area">
          <label htmlFor={`paste-${role}`}>{title} text</label>
          <textarea
            id={`paste-${role}`}
            rows={required ? 9 : 5}
            maxLength={MAX_TEXT_LENGTH + 1}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={
              role === "feedback"
                ? "Paste feedback from previous drafts, Google Classroom, Turnitin, or your teacher."
                : "Paste the original text here…"
            }
          />
          <div className="paste-footer">
            <span>{paste.length.toLocaleString()} / 160,000 characters</span>
            <div className="button-row">
              <button
                className="button small plain"
                onClick={() => {
                  setMode("upload");
                  setEditingId(undefined);
                  setPaste("");
                }}
              >
                Cancel
              </button>
              <button className="button small primary" onClick={addPasted}>
                {editingId ? "Save text" : "Add text"}
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {(!own.length || multiple) && (
            <div
              className={`upload-zone ${required ? "large" : ""} ${drag ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                void addFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <button
                type="button"
                className="drop-button"
                onClick={() => inputRef.current?.click()}
              >
                <span className="upload-icon">
                  <Upload size={21} strokeWidth={1.5} />
                </span>
                <strong>
                  {required
                    ? "Drop your assignment here"
                    : "Drop a file here, or browse"}
                </strong>
                <span>
                  {required ? (
                    <>
                      <u>Choose a file</u> or drag and drop
                    </>
                  ) : (
                    "PDF, DOCX, TXT, or MD · up to 15 MB each"
                  )}
                </span>
                {required && <small>PDF, DOCX, TXT, MD · up to 15 MB</small>}
              </button>
            </div>
          )}
          <div className="material-actions">
            {own.length > 0 && !multiple && (
              <button
                className="text-button"
                onClick={() => inputRef.current?.click()}
              >
                Replace file
              </button>
            )}
            <button className="text-button" onClick={() => setMode("paste")}>
              {own.length && !multiple
                ? "Replace with pasted text"
                : "Paste text instead"}{" "}
              <span>↗</span>
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="field-error">
          <AlertCircle size={15} />
          {error}
        </p>
      )}
    </>
  );
  if (required)
    return (
      <section className="material-section">
        <div className="material-title">
          <h2>{title}</h2>
          <span className="field-label">Required</span>
        </div>
        {content}
      </section>
    );
  return (
    <details
      className="material-section optional"
      open={initialOpen || undefined}
    >
      <summary>
        <div className="material-title">
          <h2>{title}</h2>
          {recommended && <span className="field-label">Recommended</span>}
          {own.length > 0 && (
            <span className="material-count">{own.length} added</span>
          )}
        </div>
        <ChevronDown size={17} />
      </summary>
      {content}
    </details>
  );
}
