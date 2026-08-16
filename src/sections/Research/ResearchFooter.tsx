import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildResearchFooter } from '@/animation/researchTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { RESEARCH_FOOTER } from './research.constants'

export default function ResearchFooter() {
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (reduced) return
      if (root.current) buildResearchFooter(root.current)
    },
    { dependencies: [reduced], revertOnUpdate: true, scope: root },
  )

  return (
    <div ref={root} className="research-footer">
      <span className="research-footer-marker" aria-hidden="true">
        {RESEARCH_FOOTER.marker}
      </span>

      <p className="research-footer-statement">
        {RESEARCH_FOOTER.statement.map((line) => (
          <span key={line} className="line-clip">
            <span className="research-footer-line">{line}</span>
          </span>
        ))}
      </p>

      <p className="research-footer-support">
        {RESEARCH_FOOTER.support.map((line, i) => (
          <span key={line}>
            {line}
            {i === 0 && <br />}
          </span>
        ))}
      </p>
    </div>
  )
}
