import { PRINCIPLES } from './innovation.constants'

interface Props {
  rowsRef: React.RefObject<(HTMLDivElement | null)[]>
}

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
