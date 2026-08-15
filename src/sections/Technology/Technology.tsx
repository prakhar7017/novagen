import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import {
  buildTechnologyFlow,
  buildTechnologySurface,
  buildTechnologyTimeline,
  scrollToStage,
  type TechnologyRefs,
} from '@/animation/technologyTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { scrollToY } from '@/lib/scroller'
import { useExperienceStore } from '@/store/experienceStore'
import TechnologyFlow from './TechnologyFlow'
import TechnologyHeader from './TechnologyHeader'
import TechnologyIngress from './TechnologyIngress'
import TechnologyMetadata from './TechnologyMetadata'
import TechnologyPipeline from './TechnologyPipeline'
import TechnologyStageCopy from './TechnologyStageCopy'
import { TECHNOLOGY_VH } from './technology.constants'

/**
 * Section 04 — Technology / Platform.
 *
 * Where Innovation argued a philosophy, this explains a process: sample, map,
 * interpret, predict, validate. The section returns to the dark environment and
 * to WebGL, but it is deliberately a lighter instrument than the Journey — one
 * pinned sequence, ~220 nodes rather than 6,000 particles, and a visual language
 * that reorganises rather than transforms.
 *
 * Two presentations, one story. Above 768px the stage is pinned and the
 * platform is drawn into the shared canvas; below it, and whenever motion is
 * reduced, the same five stages become a normally-flowing document with drawn
 * diagrams built from the identical arrangements.
 */
export default function Technology() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const setCanvasActive = useExperienceStore((s) => s.setCanvasActive)
  const setTechnologyStage = useExperienceStore((s) => s.setTechnologyStage)

  const flowing = reduced || isMobile

  const section = useRef<HTMLElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const plate = useRef<HTMLDivElement>(null)
  const plateIn = useRef<HTMLDivElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const headlineLines = useRef<(HTMLSpanElement | null)[]>([])
  const lead = useRef<HTMLParagraphElement>(null)
  const copies = useRef<(HTMLElement | null)[]>([])
  const metas = useRef<(HTMLDivElement | null)[]>([])
  const pipeline = useRef<HTMLDivElement>(null)
  const stageNodes = useRef<(HTMLElement | null)[]>([])

  const refs: TechnologyRefs = useMemo(
    () => ({
      section,
      veil,
      plate,
      plateIn,
      shade,
      grid,
      glow,
      header,
      label,
      headlineLines,
      lead,
      copies,
      metas,
      pipeline,
      stageNodes,
    }),
    [],
  )

  useGSAP(
    () => {
      if (flowing) buildTechnologyFlow(refs, reduced)
      else buildTechnologyTimeline(refs, setTechnologyStage, reduced)
    },
    { dependencies: [flowing, reduced, refs, setTechnologyStage], revertOnUpdate: true },
  )

  // Independent of which presentation is running: the fixed header has to leave
  // its light treatment behind, and the shared canvas has to come back on — but
  // only where there is actually a platform to draw.
  useEffect(() => {
    const el = section.current
    if (!el) return
    // In the flowing layout there is no platform in the canvas to arm or draw,
    // so only the surface switch is wired up.
    return buildTechnologySurface(
      el,
      flowing ? null : setCanvasActive,
      flowing ? () => {} : setTechnologyStage,
      flowing,
    )
  }, [flowing, setCanvasActive, setTechnologyStage])

  const jumpToStage = useCallback((index: number) => {
    const el = section.current
    if (!el) return
    scrollToY(scrollToStage(el, index))
  }, [])

  if (flowing) {
    return (
      <section
        id="technology"
        ref={section}
        className="technology technology--flow"
        aria-labelledby="technology-title"
      >
        <div className="technology-bg" aria-hidden="true" />
        <div className="technology-ingress-band" aria-hidden="true" />
        <TechnologyFlow copiesRef={copies} nodesRef={stageNodes} />
      </section>
    )
  }

  return (
    <section
      id="technology"
      ref={section}
      className="technology"
      aria-labelledby="technology-title"
      style={{ height: `${TECHNOLOGY_VH}vh` }}
    >
      <div className="technology-stage">
        {/* Environment: base wash, measurement grid, and a soft glow under the
            platform. All three are restrained by design — §37 caps the grid at
            3% and the section fails outright if it starts reading as a HUD. */}
        <div className="technology-bg" aria-hidden="true" />
        <div ref={grid} className="technology-grid" aria-hidden="true" style={{ opacity: 0 }} />
        <div ref={glow} className="technology-glow" aria-hidden="true" style={{ opacity: 0 }} />
        <div className="technology-scrim" aria-hidden="true" />

        <div className="technology-inner">
          <TechnologyHeader
            rootRef={header}
            labelRef={label}
            linesRef={headlineLines}
            leadRef={lead}
          />

          <TechnologyStageCopy copiesRef={copies} />
          <TechnologyMetadata metasRef={metas} />

          <TechnologyPipeline
            rootRef={pipeline}
            nodesRef={stageNodes}
            onSelect={jumpToStage}
          />
        </div>

        {/* Last in the stacking order: it covers the whole stage while the
            section arrives, then dissolves into it. */}
        <TechnologyIngress
          veilRef={veil}
          plateRef={plate}
          plateInRef={plateIn}
          shadeRef={shade}
        />
      </div>
    </section>
  )
}
