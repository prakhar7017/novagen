import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildResearchFooter } from '@/animation/researchTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { RESEARCH_FOOTER } from './research.constants'

/**
 * The section footer (§38, §39).
 *
 * Closes Research on its own terms — evidence is only worth as much as the
 * context around it — and, in the same breath, plants the first mark of
 * section 07. The number behind the statement is the only thing in Research
 * that grows, and it is deliberately left unexplained: Impact is where it
 * acquires a meaning, and a figure with a claim attached would be one this
 * section cannot support.
 *
 * Decorative here, and hidden from assistive technology for exactly that
 * reason: a screen reader announcing "14.8M" with no context would be
 * announcing a claim that has not been made yet.
 */
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
