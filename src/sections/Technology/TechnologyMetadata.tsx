import { TECHNOLOGY_STAGES } from './technology.constants'

interface Props {
  metasRef: React.RefObject<(HTMLDivElement | null)[]>
}

/**
 * Instrumentation for the current stage.
 *
 * Two or three thin mono pairs, never more — §22 and §62 both fail this section
 * if the readouts start competing with the science visual, and a fourth group
 * is the point at which it becomes a dashboard. Decorative: every fact implied
 * here is already stated in the stage copy, so nothing is lost when it is
 * skipped by assistive technology.
 */
export default function TechnologyMetadata({ metasRef }: Props) {
  return (
    <div className="technology-meta-slot" aria-hidden="true">
      {TECHNOLOGY_STAGES.map((stage, i) => (
        <div
          key={stage.id}
          ref={(el) => {
            if (metasRef.current) metasRef.current[i] = el
          }}
          className="technology-meta"
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          {stage.meta.map(([key, value]) => (
            <div key={key} className="technology-meta-row">
              <span className="technology-meta-key">{key}</span>
              <span className="technology-meta-value">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
