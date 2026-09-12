import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X, ChevronDown, ArrowUpRight } from "lucide-react";
import type { Evidence, Source } from "../types/audit";
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function statusTone(status: string) {
  if (/^(Met|Addressed|Resolved|Strong|Ready)$/.test(status)) return "positive";
  if (/Missing|Not addressed|High|Regressed|Needs work/.test(status))
    return "attention";
  return "neutral";
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const focused = document.activeElement as HTMLElement | null;
    el?.showModal();
    return () => {
      el?.close();
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Accordion({
  title,
  summary,
  children,
  badge,
  open = false,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  badge?: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="accordion" open={open || undefined}>
      <summary>
        <div>
          <h3>{title}</h3>
          {summary && <p>{summary}</p>}
        </div>
        <div className="accordion-end">
          {badge}
          <ChevronDown size={18} />
        </div>
      </summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}
export function EvidenceList({
  evidence,
  sources,
}: {
  evidence: Evidence[];
  sources: Source[];
}) {
  const [selected, setSelected] = useState<Evidence>();
  const source = sources.find((s) => s.id === selected?.sourceId);
  return (
    <>
      <div className="evidence-list">
        {evidence.map((item, i) => (
          <button
            className="evidence-ref"
            key={`${item.sourceId}-${i}`}
            onClick={() => setSelected(item)}
          >
            <ArrowUpRight size={12} />
            {sources.find((s) => s.id === item.sourceId)?.role === "assignment"
              ? "Assignment"
              : sources.find((s) => s.id === item.sourceId)?.name ||
                "Source"}{" "}
            · {item.location}
          </button>
        ))}
      </div>
      {selected && (
        <Dialog
          title="Source evidence"
          onClose={() => setSelected(undefined)}
          wide
        >
          <div className="eyebrow">
            {source?.name || "Source unavailable"} · {selected.location}
          </div>
          {selected.quote && <blockquote>{selected.quote}</blockquote>}
          <details className="source-text">
            <summary>Read extracted source text</summary>
            <pre>
              {source?.text ||
                "This source is unavailable. The reference could not be verified."}
            </pre>
          </details>
        </Dialog>
      )}
    </>
  );
}
export function SectionHeading({
  number,
  title,
  subtitle,
  aside,
}: {
  number?: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {number && <span className="section-number">{number}</span>}
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {aside}
    </div>
  );
}
