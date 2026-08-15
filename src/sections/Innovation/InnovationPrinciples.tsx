import { PRINCIPLES } from './innovation.constants'

interface Props {
  rowsRef: React.RefObject<(HTMLDivElement | null)[]>
}

/**
 * The three principles, as editorial rows rather than cards.
 *
 * A number, a title, one sentence and a hairline rule — no surface, no border
 * box, no icon. ACCEPTANCE_CRITERIA §27 fails the section outright if this
 * reads as a feature grid, and the rule is the only decoration that earns its
 * place: it is also what the reveal animates.
 */
export default function InnovationPrinciples({ rowsRef }: Props) {
  return (
    <ul className="innovation-principles">
      {PRINCIPLES.map((p, i) => (
        <li key={p.index}>
          <div
            ref={(el) => {
              if (rowsRef.current) rowsRef.current[i] = el
            }}
            className="innovation-principle"
          >
            <span className="innovation-principle-rule" aria-hidden="true" />
            <span className="innovation-principle-index" aria-hidden="true">
              {p.index}
            </span>
            <span className="innovation-principle-text">
              <span className="innovation-principle-title">{p.title}</span>
              <span className="innovation-principle-detail">{p.detail}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
