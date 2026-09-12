import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, CornerDownRight } from "lucide-react";
export default function HomePage({ onSample }: { onSample: () => void }) {
  return (
    <main id="main" className="home page-enter">
      <div className="home-intro">
        <div className="eyebrow">YOUR WORK, REVIEWED.</div>
        <h1>
          Know what to fix.
          <br />
          <span>See what improves.</span>
        </h1>
        <p>
          Your assignment, rubric, and teacher feedback.
          <br />
          One clear plan for your next revision.
        </p>
        <div className="button-row">
          <Link className="button primary" to="/new">
            Audit an assignment
            <ArrowRight size={16} />
          </Link>
          <button className="button plain" onClick={onSample}>
            View sample report
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="home-note">
          No account. History stays on this device.
        </div>
      </div>
      <section className="sample-preview" aria-label="Example assignment audit">
        <div className="preview-top">
          <span className="eyebrow">FROM FEEDBACK TO A NEXT STEP</span>
          <span className="preview-label">SAMPLE AUDIT</span>
        </div>
        <div className="preview-report">
          <div className="preview-aside">
            <span className="eyebrow">OVERALL READINESS</span>
            <h3>
              Strong foundation.
              <br />
              Go deeper.
            </h3>
            <p>
              A clear argument. Relevant evidence. The analysis needs to do
              more.
            </p>
            <div className="preview-source">
              <Check size={13} />
              Rubric & teacher feedback considered
            </div>
          </div>
          <div className="preview-issue">
            <div className="issue-heading">
              <span className="number-box">01</span>
              <span className="eyebrow">FIX THIS FIRST</span>
              <span className="badge attention">High priority</span>
            </div>
            <h3>Make the evidence prove your argument</h3>
            <div className="mini-evidence">
              “Industrialization therefore improved life for all workers.”
            </div>
            <div className="mini-action">
              <CornerDownRight size={16} />
              <span>
                Compare who benefited, over what period, and at what cost.
              </span>
            </div>
            <div className="evidence-list">
              <span className="evidence-ref">Assignment · Economic change</span>
              <span className="evidence-ref">Rubric · Analysis</span>
            </div>
          </div>
        </div>
        <div className="preview-footer">
          <span>
            Specific evidence. Prioritized edits. Traceable revisions.
          </span>
          <button onClick={onSample}>
            Open report
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
      <footer className="site-footer">
        <span>Assignment Audit</span>
        <span>Your work. Your revision.</span>
      </footer>
    </main>
  );
}
