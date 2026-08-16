import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildStudyEntrance, buildStudyParallax } from '@/animation/researchTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import ResearchAnnotations from './ResearchAnnotations'
import StudyBody from './StudyBody'
import { LEAD_STUDY, SPOTLIGHT_DIAMETER } from './research.constants'
import { useSpotlight } from './useSpotlight'

export default function LeadStudy() {
  const reduced = useReducedMotion()
  const canSpotlight = useMediaQuery('(hover: hover) and (pointer: fine)')
  const spotlight = canSpotlight && !reduced

  const root = useRef<HTMLElement>(null)
  const surface = useRef<HTMLDivElement>(null)

  useSpotlight(surface, spotlight)

  useGSAP(
    () => {
      if (reduced) return
      if (root.current) buildStudyEntrance(root.current, { from: 'left' })
      if (surface.current) buildStudyParallax(surface.current)
    },
    { dependencies: [reduced], revertOnUpdate: true, scope: root },
  )

  const img = LEAD_STUDY.image!

  return (
    <article ref={root} className="research-study research-study--lead">
      <div className="study-frame study-frame--lead">
        <div
          ref={surface}
          className="study-image"
          style={{ '--spot-size': `${SPOTLIGHT_DIAMETER}px` } as React.CSSProperties}
        >
          <img
            className="study-img"
            src={img.src}
            srcSet={`${img.srcNarrow} 820w, ${img.src} 1536w`}
            sizes="(max-width: 900px) 92vw, 60vw"
            width={img.width}
            height={img.height}
            alt={img.alt}
            decoding="async"
          />

          {spotlight && (
            <>
              <div
                className="study-spot"
                aria-hidden="true"
                style={{ backgroundImage: `url("${img.src}")` }}
              />
              <span className="study-spot-ring" aria-hidden="true" />
            </>
          )}

          <ResearchAnnotations />
        </div>
      </div>

      <StudyBody study={LEAD_STUDY} />
    </article>
  )
}
