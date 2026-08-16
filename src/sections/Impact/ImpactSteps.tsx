import { IMPACT_METRICS } from './impact.constants'

interface Props {
  stepsRef: React.RefObject<(HTMLElement | null)[]>
}

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
