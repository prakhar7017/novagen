import { JOURNEY_STATES } from './journey.constants'

interface Props {
  copyRef: React.RefObject<(HTMLDivElement | null)[]>
  linesRef: React.RefObject<(HTMLSpanElement | null)[][]>
}

/**
 * The seven story states as real, permanent HTML.
 *
 * All seven exist in the document at once and are revealed by opacity, so the
 * narrative is complete for screen readers and remains readable if animation
 * never runs (ACCEPTANCE_CRITERIA §17 — no essential text inside Canvas).
 */
export default function JourneyCopy({ copyRef, linesRef }: Props) {
  return (
    <div className="journey-copy-col">
      {JOURNEY_STATES.map((state, i) => (
        <div
          key={state.id}
          ref={(el) => {
            if (copyRef.current) copyRef.current[i] = el
          }}
          className="journey-copy"
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          <div className="journey-label">
            <span className="journey-label-index">{state.index}</span>
            <span className="journey-label-rule" aria-hidden="true" />
            <span>{state.label}</span>
          </div>

          <h2 className="journey-headline">
            {state.headline.map((line, li) => (
              <span key={line} className="line-clip">
                <span
                  ref={(el) => {
                    if (!linesRef.current) return
                    if (!linesRef.current[i]) linesRef.current[i] = []
                    linesRef.current[i][li] = el
                  }}
                  style={{ display: 'block' }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h2>

          <p className="journey-body">{state.body}</p>
        </div>
      ))}
    </div>
  )
}
