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

/**
 * Section 06 — Research.
 *
 * Capabilities said what the platform can do; this shows what that science
 * looks like. It is the quietest section on the page and the only one asked to
 * earn credibility rather than attention: no pin, no canvas, no cinematic
 * handoff, and a single interaction on a single image (§3, §35).
 *
 * The layout is an editorial spread — three studies with three different
 * presentations, separated by whitespace and hairlines rather than enclosed in
 * cards. §56 fails this section outright if it reads as a blog, a news list or
 * a resources grid, which is why nothing here has a border around a title and a
 * summary together.
 *
 * The section deliberately does not clip its own overflow: the Bone panel that
 * hands over from Capabilities sits above its top edge, outside its box.
 */
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

  // Independent of reduced motion: the fixed header still has to leave its dark
  // treatment behind, and the shared canvas still has nothing to draw.
  useEffect(() => {
    const el = section.current
    if (!el) return
    return buildResearchSurface(el, setCanvasActive, reduced)
  }, [setCanvasActive, reduced])

  return (
    <section id="research" ref={section} className="research" aria-labelledby="research-title">
      {/* Paper grain, generated rather than shipped (ASSET_MANIFEST §17). Its
          own filter id: the Innovation and Hero grains run at other
          frequencies and sharing one would change all three. */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="research-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="4"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" />
          </filter>
        </defs>
      </svg>

      {/* The Capabilities → Research handoff (§5, §6).

          A Bone panel that lives *above* this section's top edge and paints
          over the end of the previous one, rather than a transition owned by
          Capabilities: the two sections stay independent, and the reveal cannot
          be left half-played if the reader jumps past it. Purely decorative —
          document order already conveys the section change. */}
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

        {/* Hairlines between studies rather than borders around them: the
            editorial device that keeps three studies from becoming three
            cards (§32). */}
        <span className="research-rule" aria-hidden="true" />

        <ResearchStudy />

        <span className="research-rule research-rule--tight" aria-hidden="true" />

        <ResearchFigure />

        <ResearchFooter />
      </div>
    </section>
  )
}
