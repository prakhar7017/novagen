import { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import {
  INGRESS_VH,
  buildResearchHeader,
  buildResearchIngress,
  buildResearchSurface,
} from '@/animation/researchTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import LeadStudy from './LeadStudy'
import ResearchFigure from './ResearchFigure'
import ResearchFooter from './ResearchFooter'
import ResearchHeader from './ResearchHeader'
import ResearchStudy from './ResearchStudy'

export default function Research() {
  const reduced = useReducedMotion()
  const setCanvasActive = useExperienceStore((s) => s.setCanvasActive)

  const section = useRef<HTMLElement>(null)
  const ingress = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (reduced) return
      if (ingress.current && fill.current) buildResearchIngress(ingress.current, fill.current)
      if (header.current) buildResearchHeader(header.current)
    },
    { dependencies: [reduced], revertOnUpdate: true, scope: section },
  )

  useEffect(() => {
    const el = section.current
    if (!el) return
    return buildResearchSurface(el, setCanvasActive, reduced)
  }, [setCanvasActive, reduced])

  return (
    <section id="research" ref={section} className="research" aria-labelledby="research-title">

      <div
        ref={ingress}
        className="research-ingress"
        aria-hidden="true"
        style={{ height: `${INGRESS_VH}vh`, top: `-${INGRESS_VH}vh` }}
      >
        <div ref={fill} className="research-ingress-fill">
          <div className="research-grain" />
          <span className="research-ingress-edge" />
        </div>
      </div>

      <div className="research-grain" aria-hidden="true" />

      <div className="research-inner">
        <ResearchHeader rootRef={header} />

        <LeadStudy />

        <span className="research-rule" aria-hidden="true" />

        <ResearchStudy />

        <span className="research-rule research-rule--tight" aria-hidden="true" />

        <ResearchFigure />

        <ResearchFooter />
      </div>
    </section>
  )
}
