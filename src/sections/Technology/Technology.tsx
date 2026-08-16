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

  useEffect(() => {
    const el = section.current
    if (!el) return
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
