interface Props {
  rootRef?: React.RefObject<HTMLDivElement | null>
  labelRef?: React.RefObject<HTMLDivElement | null>
  linesRef?: React.RefObject<(HTMLSpanElement | null)[]>
  leadRef?: React.RefObject<HTMLParagraphElement | null>
}

const HEADLINE = ['From sample', 'to discovery.'] as const

export default function TechnologyHeader({ rootRef, labelRef, linesRef, leadRef }: Props) {
  return (
    <div ref={rootRef} className="technology-header">
      <div ref={labelRef} className="technology-label">
        <span className="technology-label-index">04</span>
        <span className="technology-label-slash" aria-hidden="true">
          /
        </span>
        Technology
      </div>

      <h2 id="technology-title" className="technology-headline">
        {HEADLINE.map((line, i) => (
          <span key={line} className="line-clip">
            <span
              ref={(el) => {
                if (linesRef?.current) linesRef.current[i] = el
              }}
              style={{ display: 'block' }}
            >
              {line}
            </span>
          </span>
        ))}
      </h2>

      <p ref={leadRef} className="technology-lead">
        A unified platform for mapping biological systems, interpreting complex signals
        and prioritizing high-confidence therapeutic possibilities.
      </p>
    </div>
  )
}
