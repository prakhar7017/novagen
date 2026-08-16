import { useEffect, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildCtaSurface, buildCtaTimeline, type CtaRefs } from '@/animation/ctaTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import CtaCellDrawn from './CtaCellDrawn'
import CtaContent from './CtaContent'
import { CTA_VH } from './cta.constants'

/**
 * Section 08 — Final CTA / Closing Vision.
 *
 * The end. Impact proved something; this resolves it, and then the page stops.
 *
 * Two things make it different from every section above, and both are
 * subtractions. First, there is no second visualization: the object on screen
 * is the *same* object Impact collapsed to, grown a membrane. Second, there is
 * almost nothing else — no grid, no HUD, no readouts, no photograph, no scroll
 * indicator (§28, §30, §37, §38). §56 fails this section if it reads as a SaaS
 * banner or as another feature section, and the defence against both is space.
 *
 * Two presentations, one composition. Above 768px the stage is held by
 * position:sticky while the cell resolves in the shared canvas; below it, and
 * whenever motion is reduced, the identical cell is drawn in SVG from the same
 * population and the section is a normally-flowing document. The flowing case
 * is not a fallback — Impact never draws a network there either, so there is
 * nothing to hand over from, and §50 wants the resolved state immediately.
 */
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

  // Arming, and the page's last resource cleanup. Independent of which
  // presentation is running: the flowing layout has no cell in the canvas, but
  // Impact still has a network to release on the way past it.
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
        {/* §35–§37 — one soft Bio Green field, a fainter mint secondary, 2–3%
            grain, and no grid at all. The absence of technical structure is
            most of what makes this frame read as resolved. */}
        <div className="cta-bg" aria-hidden="true" />
        <div
          ref={glow}
          className="cta-glow"
          aria-hidden="true"
          style={flowing ? undefined : { opacity: 0 }}
        />
        <div className="cta-grain" aria-hidden="true" />

        {/* Above 768px the cell lives in the shared canvas, inherited from
            Impact's collapsed target. Here it is drawn. */}
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
