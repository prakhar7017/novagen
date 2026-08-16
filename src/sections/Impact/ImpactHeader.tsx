import {
  IMPACT_HEADLINE,
  IMPACT_INDEX,
  IMPACT_LABEL,
  IMPACT_LEAD,
  IMPACT_META,
} from './impact.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
  labelRef: React.RefObject<HTMLDivElement | null>
  linesRef: React.RefObject<(HTMLSpanElement | null)[]>
  leadRef: React.RefObject<HTMLParagraphElement | null>
}

/**
 * Section label, headline and supporting copy (§10, §11).
 *
 * Sized under the Hero and deliberately restrained for a headline this wide:
 * §11 caps the measure at ~900px specifically so the metrics below can be the
 * largest type on the page. If the headline wins that contest the section has
 * failed its own hierarchy.
 *
 * The metadata line states, in plain text, that the figures are concept data.
 * §50 permits that disclosure to live in the content, and a section whose whole
 * argument is three numbers is the last place to bury it in a comment.
 */
export default function ImpactHeader({ rootRef, labelRef, linesRef, leadRef }: Props) {
  return (
    <div ref={rootRef} className="impact-header">
      <div ref={labelRef} className="impact-label">
        <span className="impact-label-name">
          <span className="impact-label-index">{IMPACT_INDEX}</span>
          <span className="impact-label-slash" aria-hidden="true">
            /
          </span>
          {IMPACT_LABEL}
        </span>

        <span className="impact-label-meta">
          <span className="impact-label-meta-key">{IMPACT_META.key}</span>
          <span className="impact-label-meta-val">{IMPACT_META.value}</span>
        </span>
      </div>

      <h2 id="impact-title" className="impact-headline">
        {IMPACT_HEADLINE.map((line, i) => (
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

      <p ref={leadRef} className="impact-lead">
        {IMPACT_LEAD}
      </p>
    </div>
  )
}
