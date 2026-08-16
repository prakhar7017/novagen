import { JOURNEY_STATES } from './journey.constants'

interface Props {
  metaRef: React.RefObject<(HTMLDivElement | null)[]>
  stepsRef: React.RefObject<(HTMLDivElement | null)[]>
}

export default function JourneyHUD({ metaRef, stepsRef }: Props) {
  return (
    <>
      <div className="journey-steps" aria-hidden="true">
        {JOURNEY_STATES.map((state, i) => (
          <div
            key={state.id}
            ref={(el) => {
              if (stepsRef.current) stepsRef.current[i] = el
            }}
            className="journey-step"
            style={{
              opacity: i === 0 ? 1 : 0.32,
              color: i === 0 ? 'var(--color-bio-green)' : 'var(--color-muted)',
            }}
          >
            {state.index}
          </div>
        ))}
      </div>

      <div className="journey-meta-slot" aria-hidden="true">
        {JOURNEY_STATES.map((state, i) => (
          <div
            key={state.id}
            ref={(el) => {
              if (metaRef.current) metaRef.current[i] = el
            }}
            className="journey-meta"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {state.meta.map(([k, v]) => (
              <div key={k} className="journey-meta-row">
                <span className="journey-meta-key">{k}</span>
                <span className="journey-meta-val">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
