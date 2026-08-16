import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildStudyEntrance, buildStudyParallax } from '@/animation/researchTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import StudyBody from './StudyBody'
import { SECOND_STUDY } from './research.constants'

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
