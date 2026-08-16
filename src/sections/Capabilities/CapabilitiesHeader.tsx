import {
  CAPABILITIES_HEADLINE,
  CAPABILITIES_LEAD,
} from './capabilities.constants'

interface Props {
  labelRef: React.RefObject<HTMLDivElement | null>
  linesRef: React.RefObject<(HTMLSpanElement | null)[]>
  leadRef: React.RefObject<HTMLParagraphElement | null>
}

export default function CapabilitiesHeader({ labelRef, linesRef, leadRef }: Props) {
  return (
    <div className="capabilities-header">
      <div ref={labelRef} className="capabilities-label">
        <span className="capabilities-label-name">
          <span className="capabilities-label-index">05</span>
          <span className="capabilities-label-slash" aria-hidden="true">
            /
          </span>
          Capabilities
        </span>

        <span className="capabilities-label-scale" aria-hidden="true">
          <span className="capabilities-label-scale-key">Scales</span>
          <span className="capabilities-label-scale-val">
            Spatial → Molecular → Computational
          </span>
        </span>
      </div>

      <h2 id="capabilities-title" className="capabilities-headline">
        {CAPABILITIES_HEADLINE.map((line, i) => (
          <span key={line} className="line-clip">
            <span
              ref={(el) => {
                if (linesRef.current) linesRef.current[i] = el
              }}
              style={{ display: 'block' }}
            >
              {line}
            </span>
          </span>
        ))}
      </h2>

      <p ref={leadRef} className="capabilities-lead">
        {CAPABILITIES_LEAD}
      </p>
    </div>
  )
}
