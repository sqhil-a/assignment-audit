import { useState, useEffect } from "react";
import { Check, FileCheck2, LoaderCircle } from "lucide-react";
const stages = [
  "Reading assignment",
  "Reviewing requirements",
  "Mapping rubric criteria",
  "Checking teacher feedback",
  "Evaluating evidence",
  "Building recommendations",
  "Preparing report",
];
export default function AnalysisProgress({
  demo,
  onCancel,
}: {
  demo: boolean;
  onCancel: () => void;
}) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStage((i) => Math.min(stages.length - 1, i + 1)),
      demo ? 300 : 4200,
    );
    return () => clearInterval(id);
  }, [demo]);
  return (
    <main id="main" className="analysis-screen">
      <span className="analysis-logo">
        <FileCheck2 size={26} />
      </span>
      <div className="eyebrow">
        {demo ? "SAMPLE AUDIT" : "ASSIGNMENT AUDIT"}
      </div>
      <h1>{demo ? "Opening the sample." : "Taking a closer look."}</h1>
      <p>
        {demo
          ? "Demonstration only. Your materials are not analyzed."
          : "Your materials are being reviewed together."}
      </p>
      <div className="analysis-stages" aria-label="Audit preparation steps">
        {stages.map((s, i) => (
          <div
            key={s}
            className={i === stage ? "current" : i < stage ? "done" : ""}
          >
            {i < stage ? (
              <Check size={15} />
            ) : i === stage ? (
              <LoaderCircle size={15} className="spinning" />
            ) : (
              <span className="stage-dot" />
            )}
            {s}
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        {stages[stage]}
      </span>
      <button className="button small" onClick={onCancel}>
        Cancel audit
      </button>
    </main>
  );
}
