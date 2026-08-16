import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildStudyEntrance, buildStudyParallax } from '@/animation/researchTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import StudyBody from './StudyBody'
import { SECOND_STUDY } from './research.constants'

/**
 * Study 02 — the compact reversed row (§23, §24).
 *
 * Text left, image right: the mirror of the lead study, and the reason the two
 * read as a sequence rather than a repeated template. It is also deliberately
 * smaller — the second study supports the first, and giving it the same weight
 * would flatten the section into two equal features.
 *
 * No spotlight and no readouts here. The interaction belongs to the lead study
 * alone; a second image that behaves the same way turns a considered detail
 * into a component (§56).
 */
export default function ResearchStudy() {
  const reduced = useReducedMotion()

  const root = useRef<HTMLElement>(null)
  const surface = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (reduced) return
      if (root.current) buildStudyEntrance(root.current, { from: 'right' })
      if (surface.current) buildStudyParallax(surface.current)
    },
    { dependencies: [reduced], revertOnUpdate: true, scope: root },
  )

  const img = SECOND_STUDY.image!

  return (
    <article ref={root} className="research-study research-study--second">
      <StudyBody study={SECOND_STUDY} />

      <div className="study-frame study-frame--second">
        <div ref={surface} className="study-image">
          <img
            className="study-img study-img--protein"
            src={img.src}
            srcSet={`${img.srcNarrow} 720w, ${img.src} 1200w`}
            sizes="(max-width: 900px) 92vw, 52vw"
            width={img.width}
            height={img.height}
            alt={img.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </article>
  )
}
