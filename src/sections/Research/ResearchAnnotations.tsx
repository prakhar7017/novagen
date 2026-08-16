import { LEAD_ANNOTATIONS, LEAD_SCALE } from './research.constants'

/**
 * Instrumentation over the lead study's tissue field (§18).
 *
 * Two readouts and a scale bar — the whole budget §18 allows, and deliberately
 * less than the Innovation microscopy carries: by this point in the page the
 * reader has seen the instrument twice, and Research earns its credibility
 * from the science rather than from the overlay.
 *
 * Thin leader lines, no panels, nothing baked into the image. Decorative by
 * construction: every fact implied here is either stated in the study copy or
 * irrelevant to it, so the section loses nothing when these are hidden — which
 * they are below 900px, where the frame is too small to carry them.
 */
export default function ResearchAnnotations() {
  return (
    <div className="study-annotations" aria-hidden="true">
      {LEAD_ANNOTATIONS.map((a, i) => (
        <div
          key={a.label}
          className={`study-annotation study-annotation--${a.side}`}
          data-annotation={i}
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
        >
          <svg className="study-annotation-marker" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="5.6" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" />
          </svg>

          <span className="study-annotation-leader" />

          <span className="study-annotation-text">
            <span className="study-annotation-label">{a.label}</span>
            <span className="study-annotation-value">{a.value}</span>
          </span>
        </div>
      ))}

      {/* A scale bar rather than a third marker: it states the one fact the
          image cannot imply on its own, and it does it in the corner where no
          biology is being covered. */}
      <div className="study-scale">
        <span className="study-scale-bar" />
        <span className="study-scale-text">{LEAD_SCALE}</span>
      </div>
    </div>
  )
}
