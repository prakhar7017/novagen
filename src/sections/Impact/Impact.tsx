import { useEffect, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import {
  buildImpactFlow,
  buildImpactSurface,
  buildImpactTimeline,
  type ImpactRefs,
} from '@/animation/impactTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import ConfidenceArc from './ConfidenceArc'
import HumanMoment from './HumanMoment'
import ImpactFlow from './ImpactFlow'
import ImpactHeader from './ImpactHeader'
import ImpactIngress from './ImpactIngress'
import ImpactMetrics from './ImpactMetrics'
import ImpactSteps from './ImpactSteps'
import { IMPACT_DISCLOSURE, IMPACT_VH } from './impact.constants'
import type { ImpactDensity } from '@/scene/Impact/impactTargets'

/**
 * Density per presentation.
 *
 * The signal field is the whole abstraction for 14.8M (§15), so it takes the
 * budget: ~2,600 tiny points on a desktop against ~200 legible nodes, which
 * lands squarely in §15's 1,500–3,000 / 100–250 bands. The flowing layout draws
 * three static SVGs instead of one canvas, so its counts are lower still —
 * three diagrams' worth of DOM is the cost there, not GPU time (§42).
 */
const DENSITY: Record<'desktop' | 'laptop' | 'tablet' | 'flow', ImpactDensity> = {
  desktop: { signals: 2600, nodes: 210, maxLines: 260 },
  laptop: { signals: 2000, nodes: 180, maxLines: 220 },
  tablet: { signals: 1300, nodes: 130, maxLines: 160 },
  flow: { signals: 620, nodes: 62, maxLines: 90 },
}

/**
 * Section 07 — Impact / Outcomes.
 *
 * Research showed what the science looks like; this states what it enables. The
 * page returns to the dark environment and to WebGL for the last time, and the
 * whole section is one argument in three states: 14.8M relationships exist,
 * 72× filtering reduces them, 91% confidence remains. §55 fails the section
 * outright if it reads as three statistic cards, which is why every figure here
 * changes the visualization rather than sitting beside it.
 *
 * Two presentations, one story. Above 768px the stage is held by
 * position:sticky and the network is drawn into the shared canvas; below it,
 * and whenever motion is reduced, the same three arrangements become a
 * normally-flowing document with drawn diagrams built from the identical
 * typed arrays.
 *
 * The section ends prepared rather than finished: `scrollProgress.impactExit`
 * and the single glowing point the network collapses to are what section 08
 * inherits (§53, §61).
 */
export default function Impact() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const setCanvasActive = useExperienceStore((s) => s.setCanvasActive)
  const setImpactStage = useExperienceStore((s) => s.setImpactStage)
  const stage = useExperienceStore((s) => s.impactStage)

  const flowing = reduced || isMobile

  const section = useRef<HTMLElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const signals = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const headlineLines = useRef<(HTMLSpanElement | null)[]>([])
  const lead = useRef<HTMLParagraphElement>(null)
  const metrics = useRef<(HTMLElement | null)[]>([])
  const steps = useRef<(HTMLElement | null)[]>([])
  const arc = useRef<SVGCircleElement>(null)
  const arcRoot = useRef<SVGSVGElement>(null)
  const human = useRef<HTMLDivElement>(null)
  const humanFrame = useRef<HTMLDivElement>(null)

  const refs: ImpactRefs = useMemo(
    () => ({
      section,
      veil,
      signals,
      glow,
      grid,
      header,
      label,
      headlineLines,
      lead,
      metrics,
      steps,
      arc,
      arcRoot,
      human,
      humanFrame,
    }),
    [],
  )

  useGSAP(
    () => {
      if (flowing) {
        // Reduced motion builds nothing at all: §49 asks for three static
        // scientific states, not for a section that has to be scrolled past to
        // become complete. The mobile layout keeps its entrances.
        if (!reduced) buildImpactFlow(refs)
      } else {
        buildImpactTimeline(refs, setImpactStage, false)
      }
    },
    { dependencies: [flowing, reduced, refs, setImpactStage], revertOnUpdate: true },
  )

  // Independent of which presentation is running: the fixed header has to leave
  // Research's light treatment behind, and the shared canvas — stopped since
  // Capabilities — has to come back on where there is a network to draw.
  useEffect(() => {
    const el = section.current
    if (!el) return
    return buildImpactSurface(
      el,
      flowing ? () => {} : setCanvasActive,
      flowing ? () => {} : setImpactStage,
      flowing,
    )
  }, [flowing, setCanvasActive, setImpactStage])

  if (flowing) {
    return (
      <section
        id="impact"
        ref={section}
        className="impact impact--flow"
        aria-labelledby="impact-title"
      >
        <div className="impact-bg" aria-hidden="true" />
        <div className="impact-grain" aria-hidden="true" />
        <ImpactFlow refs={refs} density={DENSITY.flow} />
      </section>
    )
  }

  return (
    <section
      id="impact"
      ref={section}
      className="impact"
      aria-labelledby="impact-title"
      style={{ height: `${IMPACT_VH}vh` }}
    >

      <div className="impact-stage">
        {/* Environment (§29): base wash, a very faint measurement grid and one
            soft glow under the network. All three are at the edge of visible —
            §29 caps the grid at 2% and the Bio Green field at 8%. */}
        <div className="impact-bg" aria-hidden="true" />
        <div ref={grid} className="impact-grid" aria-hidden="true" style={{ opacity: 0 }} />
        <div ref={glow} className="impact-glow" aria-hidden="true" style={{ opacity: 0 }} />
        <div className="impact-grain" aria-hidden="true" />

        <div className="impact-inner">
          <ImpactHeader
            rootRef={header}
            labelRef={label}
            linesRef={headlineLines}
            leadRef={lead}
          />

          <ImpactMetrics metricsRef={metrics} />

          <ImpactSteps stepsRef={steps} />

          {/* Sits over the validated candidate in the canvas behind. Positioned
              in CSS against the same right-biased composition the scene uses. */}
          <ConfidenceArc rootRef={arcRoot} arcRef={arc} />

          {/* §52 — the crop is not requested until the section has actually
              reached its final state, two and a half viewports down the page. */}
          <HumanMoment
            rootRef={human}
            frameRef={humanFrame}
            loaded={stage === 'validate'}
          />

          <p className="impact-disclosure sr-only">{IMPACT_DISCLOSURE}</p>
        </div>

        {/* Last in the stacking order: the Bone veil covers the whole stage
            while the section arrives, then is clipped away over the lit
            scatter it leaves behind (§7). */}
        <ImpactIngress veilRef={veil} signalsRef={signals} />
      </div>
    </section>
  )
}
