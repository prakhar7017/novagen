import { TECHNOLOGY_STAGES } from './technology.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
  nodesRef: React.RefObject<(HTMLElement | null)[]>
  onSelect: (index: number) => void
}

export default function TechnologyPipeline({ rootRef, nodesRef, onSelect }: Props) {
  return (
    <nav ref={rootRef} className="technology-pipeline" aria-label="Platform pipeline">
      <div className="technology-pipeline-track" aria-hidden="true">
        <span className="technology-pipeline-fill" />
      </div>

      <ol className="technology-pipeline-list">
        {TECHNOLOGY_STAGES.map((stage, i) => (
          <li key={stage.id} className="technology-pipeline-item">
            <button
              type="button"
              ref={(el) => {
                if (nodesRef.current) nodesRef.current[i] = el
              }}
              className="technology-pipeline-node"
              aria-current={i === 0 ? 'step' : 'false'}
              onClick={() => onSelect(i)}
            >
              <span className="technology-pipeline-dot" aria-hidden="true" />
              <span className="technology-pipeline-index">{stage.index}</span>
              <span className="technology-pipeline-label">{stage.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
