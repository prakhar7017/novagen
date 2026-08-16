import { LEAD_ANNOTATIONS, LEAD_SCALE } from './research.constants'

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

      <div className="study-scale">
        <span className="study-scale-bar" />
        <span className="study-scale-text">{LEAD_SCALE}</span>
      </div>
    </div>
  )
}
