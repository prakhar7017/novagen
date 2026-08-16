import { TECHNOLOGY_STAGES } from './technology.constants'

interface Props {
  copiesRef: React.RefObject<(HTMLElement | null)[]>
}

export default function TechnologyStageCopy({ copiesRef }: Props) {
  return (
    <div className="technology-stage-slot">
      {TECHNOLOGY_STAGES.map((stage, i) => (
        <div
          key={stage.id}
          ref={(el) => {
            if (copiesRef.current) copiesRef.current[i] = el
          }}
          className="technology-stage-copy"
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          <div className="technology-stage-label">
            <span className="technology-stage-index">{stage.index}</span>
            <span className="technology-stage-slash" aria-hidden="true">
              /
            </span>
            {stage.label}
          </div>

          <h3 className="technology-stage-title">
            {stage.title.map((line) => (
              <span key={line} className="line-clip">
                <span className="technology-stage-line" style={{ display: 'block' }}>
                  {line}
                </span>
              </span>
            ))}
          </h3>

          <p className="technology-stage-body">{stage.body}</p>
        </div>
      ))}
    </div>
  )
}
