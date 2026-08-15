import { TECHNOLOGY_STAGES } from './technology.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
  nodesRef: React.RefObject<(HTMLElement | null)[]>
  onSelect: (index: number) => void
}

/**
 * The pipeline rail.
 *
 * One thin line with five points on it, filled by scroll — §35 asks for exactly
 * this and rules out a progress bar, so the fill is a hairline advancing with
 * the same continuous stage index the scene morphs with. The rail *is* the
 * interface for this section; there are no cards (§9).
 *
 * Every stage is a real button: keyboard reachable, focus visible, and it only
 * asks the page to scroll where the reader could have scrolled anyway — scroll
 * stays the primary control (§36). The current step is carried by `aria-current`
 * as well as by colour, and the active dot changes shape, so nothing here
 * depends on distinguishing two greens (§55).
 */
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
              // Kept in sync by the scroll timeline rather than by React: it
              // changes five times per pass and never needs a re-render to.
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
