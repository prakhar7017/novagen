import { IMPACT_METRICS } from './impact.constants'

interface Props {
  stepsRef: React.RefObject<(HTMLElement | null)[]>
}

/**
 * The step indicator (§32).
 *
 * Three marks along the bottom edge. Deliberately not a navigation component:
 * nothing here is clickable, nothing is focusable, and it carries no more
 * information than the metric label already states directly above it — which is
 * why it is hidden from assistive technology rather than duplicating the same
 * three words in the accessibility tree.
 *
 * §32 allows either the numbers or the words; both are shown, with the number
 * as the constant element and the word appearing only on the current step. That
 * keeps the resting state to three small marks while still letting the active
 * one say what it is.
 */
export default function ImpactSteps({ stepsRef }: Props) {
  return (
    <div className="impact-steps" aria-hidden="true">
      {IMPACT_METRICS.map((metric, i) => (
        <span
          key={metric.id}
          ref={(el) => {
            if (stepsRef.current) stepsRef.current[i] = el
          }}
          className={`impact-step${i === 0 ? ' is-current' : ''}`}
        >
          <span className="impact-step-rule" />
          <span className="impact-step-index">{metric.index}</span>
          <span className="impact-step-label">{metric.label}</span>
        </span>
      ))}
    </div>
  )
}
