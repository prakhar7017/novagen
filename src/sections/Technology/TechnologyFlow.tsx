import TechnologyDiagram from './TechnologyDiagram'
import TechnologyHeader from './TechnologyHeader'
import { useDiagramTargets } from './useDiagramTargets'
import { TECHNOLOGY_STAGES } from './technology.constants'

interface Props {
  copiesRef: React.RefObject<(HTMLElement | null)[]>
  nodesRef: React.RefObject<(HTMLElement | null)[]>
}

/**
 * Technology as a normally-scrolling document.
 *
 * Used below 769px and under reduced motion. The five stages become five short
 * blocks, each with the drawn state of the platform above its copy, and the
 * pipeline is not a separate widget here — it runs down the left gutter as the
 * spine the blocks hang from, which is the vertical progress §48 asks for and
 * costs nothing extra to read.
 *
 * Nothing is pinned and nothing is scrubbed, so there is no way to be trapped
 * inside it and no long animation to sit through, but the process, the order
 * and every word of the copy are identical to the pinned version.
 */
export default function TechnologyFlow({ copiesRef, nodesRef }: Props) {
  const targets = useDiagramTargets()

  return (
    <div className="technology-flow">
      <TechnologyHeader />

      <ol className="technology-flow-stages">
        {TECHNOLOGY_STAGES.map((stage, i) => (
          <li key={stage.id} className="technology-flow-item">
            <article
              ref={(el) => {
                if (copiesRef.current) copiesRef.current[i] = el
              }}
              className="technology-flow-stage"
            >
              <div
                ref={(el) => {
                  if (nodesRef.current) nodesRef.current[i] = el
                }}
                className="technology-stage-label technology-flow-label"
              >
                <span className="technology-pipeline-dot" aria-hidden="true" />
                <span className="technology-stage-index">{stage.index}</span>
                <span className="technology-stage-slash" aria-hidden="true">
                  /
                </span>
                {stage.label}
              </div>

              <TechnologyDiagram stage={stage.id} targets={targets} />

              <h3 className="technology-stage-title">{stage.title.join(' ')}</h3>

              <p className="technology-stage-body">{stage.body}</p>

              <div className="technology-meta technology-meta--flow" aria-hidden="true">
                {stage.meta.map(([key, value]) => (
                  <div key={key} className="technology-meta-row">
                    <span className="technology-meta-key">{key}</span>
                    <span className="technology-meta-value">{value}</span>
                  </div>
                ))}
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}
