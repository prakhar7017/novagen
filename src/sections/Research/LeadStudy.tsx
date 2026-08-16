import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildStudyEntrance, buildStudyParallax } from '@/animation/researchTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import ResearchAnnotations from './ResearchAnnotations'
import StudyBody from './StudyBody'
import { LEAD_STUDY, SPOTLIGHT_DIAMETER } from './research.constants'
import { useSpotlight } from './useSpotlight'

/**
 * Study 01 — the section's visual anchor (§14–§20).
 *
 * A large microscopy field on the left and a narrow text column on the right,
 * with nothing between them: no card, no glass, no panel. §16 is explicit that
 * the image is the object here, so it gets a radius, a hairline border, a very
 * soft shadow, and is otherwise left alone against the Bone.
 *
 * This is the one asset in the section that can be on screen within a viewport
 * of the reader arriving, so it loads eagerly while the study below it does
 * not — a shutter reveal over a half-decoded image is worse than no reveal.
 */
export default function LeadStudy() {
  const reduced = useReducedMotion()
  // Pointer-fine only. A spotlight that follows a finger is not an observation,
  // and on a phone the frame is barely larger than the region itself (§20, §47).
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
        {/* Two nested elements, two owners: the frame is clipped by the entrance
            shutter, and this one carries the parallax. Everything positioned
            over the biology — readouts, scale bar, spotlight — lives inside
            this one so it drifts with the image rather than across it. */}
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

          {/* The region itself: the same field, brighter and slightly harder,
              shown through a soft circular mask that follows the pointer.
              Rendered only where a fine pointer exists, so a phone never
              fetches the second copy — and it is the same URL, so a desktop
              never fetches it twice. */}
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
