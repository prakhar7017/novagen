import { useEffect, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildCtaSurface, buildCtaTimeline, type CtaRefs } from '@/animation/ctaTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import CtaCellDrawn from './CtaCellDrawn'
import CtaContent from './CtaContent'
import { CTA_VH } from './cta.constants'

export default function Cta() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')

  const setCtaArmed = useExperienceStore((s) => s.setCtaArmed)
  const setCanvasActive = useExperienceStore((s) => s.setCanvasActive)
  const setImpactStage = useExperienceStore((s) => s.setImpactStage)

  const flowing = reduced || isMobile

  const section = useRef<HTMLElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const headlineLines = useRef<(HTMLSpanElement | null)[]>([])
  const lead = useRef<HTMLParagraphElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const brand = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const cell = useRef<HTMLDivElement>(null)

  const refs: CtaRefs = useMemo(
    () => ({ section, label, headlineLines, lead, actions, brand, glow, cell }),
    [],
  )

  useGSAP(
    () => {
      buildCtaTimeline(refs, { reduced, flowing })
    },
    { dependencies: [refs, reduced, flowing], revertOnUpdate: true },
  )

  useEffect(() => {
    const el = section.current
    if (!el) return
    return buildCtaSurface(
      el,
      flowing ? () => {} : setCtaArmed,
      flowing ? () => {} : setCanvasActive,
      () => setImpactStage(null),
      () => setImpactStage('validate'),
    )
  }, [flowing, setCtaArmed, setCanvasActive, setImpactStage])

  return (
    <section
      id="cta"
      ref={section}
      className={flowing ? 'cta cta--flow' : 'cta'}
      aria-labelledby="cta-title"
      style={flowing ? undefined : { height: `${CTA_VH}vh` }}
    >

      <div className="cta-stage">
        <div className="cta-bg" aria-hidden="true" />
        <div
          ref={glow}
          className="cta-glow"
          aria-hidden="true"
          style={flowing ? undefined : { opacity: 0 }}
        />
        <div className="cta-grain" aria-hidden="true" />

        {flowing && <CtaCellDrawn rootRef={cell} />}

        <CtaContent
          labelRef={label}
          linesRef={headlineLines}
          leadRef={lead}
          actionsRef={actions}
          brandRef={brand}
          compact={isMobile}
          reduced={reduced}
          magnetic={!reduced && !isCoarsePointer}
        />
      </div>
    </section>
  )
}
