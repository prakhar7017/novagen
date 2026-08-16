import { SCALE_STAGES } from './innovation.constants'

interface Props {
  stagesRef: React.RefObject<(HTMLDivElement | null)[]>
}

export default function InnovationScale({ stagesRef }: Props) {
  return (
    <div className="innovation-scale">
      <span className="innovation-scale-key">Biological scale</span>

      <ol className="innovation-scale-track">
        {SCALE_STAGES.map((stage, i) => (
          <li key={stage} className="innovation-scale-item">
            <div
              ref={(el) => {
                if (stagesRef.current) stagesRef.current[i] = el
              }}
              className={`innovation-scale-stage${i === 0 ? ' is-active' : ''}`}
            >
              <span className="innovation-scale-dot" aria-hidden="true" />
              <span className="innovation-scale-name">{stage}</span>
            </div>
            {i < SCALE_STAGES.length - 1 && (
              <span className="innovation-scale-rule" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
