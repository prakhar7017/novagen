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

const DENSITY: Record<'desktop' | 'laptop' | 'tablet' | 'flow', ImpactDensity> = {
  desktop: { signals: 2600, nodes: 210, maxLines: 260 },
  laptop: { signals: 2000, nodes: 180, maxLines: 220 },
  tablet: { signals: 1300, nodes: 130, maxLines: 160 },
  flow: { signals: 620, nodes: 62, maxLines: 90 },
}

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
        if (!reduced) buildImpactFlow(refs)
      } else {
        buildImpactTimeline(refs, setImpactStage, false)
      }
    },
    { dependencies: [flowing, reduced, refs, setImpactStage], revertOnUpdate: true },
  )

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

          <ConfidenceArc rootRef={arcRoot} arcRef={arc} />

          <HumanMoment
            rootRef={human}
            frameRef={humanFrame}
            loaded={stage === 'validate'}
          />

          <p className="impact-disclosure sr-only">{IMPACT_DISCLOSURE}</p>
        </div>

        <ImpactIngress veilRef={veil} signalsRef={signals} />
      </div>
    </section>
  )
}
