import { useRef, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import { buildJourneyTimeline, type JourneyRefs } from '@/animation/journeyTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { HANDOFF_VH } from '@/sections/Innovation/innovation.constants'
import InnovationAperture from '@/sections/Innovation/InnovationAperture'
import JourneyCopy from './JourneyCopy'
import JourneyHUD from './JourneyHUD'
import JourneyStatic from './JourneyStatic'

export default function Journey() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTabletPortrait = useMediaQuery('(max-width: 900px)')

  const section = useRef<HTMLElement>(null)
  const copy = useRef<(HTMLDivElement | null)[]>([])
  const lines = useRef<(HTMLSpanElement | null)[][]>([])
  const meta = useRef<(HTMLDivElement | null)[]>([])
  const steps = useRef<(HTMLDivElement | null)[]>([])

  const refs: JourneyRefs = useMemo(
    () => ({ section, copy, lines, meta, steps }),
    [],
  )

  const handoffVh = isMobile ? HANDOFF_VH.mobile : HANDOFF_VH.desktop

  useGSAP(() => buildJourneyTimeline(refs, reduced, handoffVh), {
    dependencies: [reduced, handoffVh],
    revertOnUpdate: true,
  })

  if (reduced) return <JourneyStatic />

  const scrollLength = isMobile ? 300 : isTabletPortrait ? 360 : 460

  return (
    <section
      id="journey"
      ref={refs.section}
      className="journey"
      aria-label="The biological journey"
      style={{ height: `${scrollLength + handoffVh}vh` }}
    >
      <div className="journey-stage">
        <div className="journey-bg" aria-hidden="true" />
        <div className="journey-grid" aria-hidden="true" />
        <div className="journey-scrim" aria-hidden="true" />

        <JourneyCopy copyRef={refs.copy} linesRef={refs.lines} />
        <JourneyHUD metaRef={refs.meta} stepsRef={refs.steps} />

        <InnovationAperture handoffVh={handoffVh} />
      </div>
    </section>
  )
}
