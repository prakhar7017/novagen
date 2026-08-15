import { ANNOTATIONS } from './innovation.constants'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Instrumentation over the microscopy frame.
 *
 * Two readouts plus a third that drops below 1024px, each a small target marker
 * and a thin leader into mono type. Kept well under the density of a HUD: this
 * section's job is credibility, and prompt §47 puts annotations last in the
 * visual hierarchy, behind the headline, the visual and the copy.
 *
 * Decorative by construction — every fact implied here is stated in the body
 * copy, so the section loses nothing when these are hidden or unread.
 */
export default function MicroscopyAnnotations({ containerRef }: Props) {
  return (
    <div ref={containerRef} className="innovation-annotations" aria-hidden="true">
      {ANNOTATIONS.map((a) => (
        <div
          key={a.label}
          className={`innovation-annotation innovation-annotation--${a.side}${
            a.secondary ? ' is-secondary' : ''
          }`}
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
        >
          <svg className="innovation-annotation-marker" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
            <circle cx="10" cy="10" r="1.4" fill="currentColor" />
            <path d="M10 0v3.2M10 16.8V20M0 10h3.2M16.8 10H20" stroke="currentColor" strokeWidth="0.9" />
          </svg>

          <span className="innovation-annotation-leader" />

          <span className="innovation-annotation-text">
            <span className="innovation-annotation-label">{a.label}</span>
            <span className="innovation-annotation-value">{a.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
