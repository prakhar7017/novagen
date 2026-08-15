import { TECHNOLOGY_STAGES } from './technology.constants'

interface Props {
  copiesRef: React.RefObject<(HTMLElement | null)[]>
}

/**
 * The five stage descriptions, stacked in one box.
 *
 * All five are in the document at all times and only opacity separates them, so
 * the whole process is available to a screen reader in order even though the
 * eye sees one at a time (§55). Titles are h3 under the section's h2 — the
 * pipeline is a genuine outline, not five decorated captions.
 */
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
          // The first stage is legible before any timeline runs, so the section
          // is never blank if JavaScript is slow to arrive.
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
